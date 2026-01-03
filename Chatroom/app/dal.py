from sqlalchemy.orm import Session
from .models import User, FriendRequest, Friendship, Conversation, ConversationParticipant, Message, MessageRead
from typing import List, Tuple, Optional
from datetime import datetime, timezone

# User functions
def create_user(db: Session, display_name: str, email: str, avatar_url: str = None) -> User:
    user = User(
        display_name=display_name,
        email=email,
        avatar_url=avatar_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

# Friend request functions
def create_friend_request(db: Session, from_user_id: int, to_user_id: int) -> FriendRequest:
    # Check if request already exists
    existing = db.query(FriendRequest).filter(
        FriendRequest.from_user_id == from_user_id,
        FriendRequest.to_user_id == to_user_id,
        FriendRequest.status == "pending"
    ).first()
    if existing:
        return existing

    request = FriendRequest(from_user_id=from_user_id, to_user_id=to_user_id)
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

def respond_friend_request(db: Session, request_id: int, user_id: int, accept: bool) -> bool:
    request = db.query(FriendRequest).filter(
        FriendRequest.id == request_id,
        FriendRequest.to_user_id == user_id
    ).first()

    if not request:
        return False

    if accept:
        request.status = "accepted"
        # Create friendship
        friendship = Friendship(
            user_id_a=min(request.from_user_id, request.to_user_id),
            user_id_b=max(request.from_user_id, request.to_user_id)
        )
        db.add(friendship)
    else:
        request.status = "rejected"

    db.commit()
    return True

def get_friend_requests(db: Session, user_id: int) -> Tuple[List[FriendRequest], List[FriendRequest]]:
    received = db.query(FriendRequest).filter(
        FriendRequest.to_user_id == user_id,
        FriendRequest.status == "pending"
    ).all()

    sent = db.query(FriendRequest).filter(
        FriendRequest.from_user_id == user_id,
        FriendRequest.status == "pending"
    ).all()

    return received, sent

# Friendship functions
def are_friends(db: Session, user_id_a: int, user_id_b: int) -> bool:
    friendship = db.query(Friendship).filter(
        ((Friendship.user_id_a == user_id_a) & (Friendship.user_id_b == user_id_b)) |
        ((Friendship.user_id_a == user_id_b) & (Friendship.user_id_b == user_id_a))
    ).first()
    return friendship is not None

def get_friends(db: Session, user_id: int) -> List[User]:
    friendships = db.query(Friendship).filter(
        (Friendship.user_id_a == user_id) | (Friendship.user_id_b == user_id)
    ).all()

    friend_ids = []
    for friendship in friendships:
        if friendship.user_id_a == user_id:
            friend_ids.append(friendship.user_id_b)
        else:
            friend_ids.append(friendship.user_id_a)

    if not friend_ids:
        return []

    return db.query(User).filter(User.id.in_(friend_ids)).all()

# Conversation functions
def get_or_create_direct_conversation(db: Session, user_id_a: int, user_id_b: int) -> Optional[int]:
    if not are_friends(db, user_id_a, user_id_b):
        return None

    # Check if conversation already exists
    participants = db.query(ConversationParticipant).join(Conversation).filter(
        Conversation.type == "direct"
    ).subquery()

    # This is a simplified check - in a real app you'd need more complex logic
    # For now, create a new conversation each time
    conversation = Conversation(type="direct")
    db.add(conversation)
    db.flush()  # Get the ID

    # Add participants
    db.add(ConversationParticipant(conversation_id=conversation.id, user_id=user_id_a))
    db.add(ConversationParticipant(conversation_id=conversation.id, user_id=user_id_b))

    db.commit()
    return conversation.id

# Message functions
def save_message(db: Session, conversation_id: int, sender_id: int, content: str) -> Message:
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

def list_messages(db: Session, conversation_id: int, limit: int = 50, offset: int = 0) -> List[Message]:
    return db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.desc()).offset(offset).limit(limit).all()

def mark_read(db: Session, message_id: int, user_id: int):
    # Check if already marked as read
    existing = db.query(MessageRead).filter(
        MessageRead.message_id == message_id,
        MessageRead.user_id == user_id
    ).first()

    if not existing:
        read_record = MessageRead(message_id=message_id, user_id=user_id)
        db.add(read_record)
        db.commit()

def get_unread_count(db: Session, user_id: int) -> int:
    # Get all conversations user participates in
    participant_convs = db.query(ConversationParticipant.conversation_id).filter(
        ConversationParticipant.user_id == user_id
    ).subquery()

    # Count messages not read by user
    unread = db.query(Message).filter(
        Message.conversation_id.in_(participant_convs),
        Message.sender_id != user_id,
        ~Message.id.in_(
            db.query(MessageRead.message_id).filter(MessageRead.user_id == user_id)
        )
    ).count()

    return unread

def get_conversations(db: Session, user_id: int) -> List[dict]:
    # Get conversations where user is a participant
    conversations = db.query(Conversation).join(ConversationParticipant).filter(
        ConversationParticipant.user_id == user_id
    ).all()

    result = []
    for conv in conversations:
        # Get other participants
        participants = db.query(User).join(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv.id,
            User.id != user_id
        ).all()

        # Get last message
        last_message = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(Message.created_at.desc()).first()

        result.append({
            'id': conv.id,
            'type': conv.type,
            'name': conv.name,
            'participants': [{'id': p.id, 'display_name': p.display_name, 'avatar_url': p.avatar_url} for p in participants],
            'last_message': {
                'content': last_message.content if last_message else None,
                'sender_id': last_message.sender_id if last_message else None,
                'created_at': last_message.created_at.isoformat() if last_message else None
            } if last_message else None
        })

    return result