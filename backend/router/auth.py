from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend import model, schema, token
from backend.database import get_db
from backend.hashing import Hash

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=schema.UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: schema.UserCreate, db: Session = Depends(get_db)):

    if db.query(model.User).filter(model.User.email == request.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    
    if db.query(model.User).filter(model.User.username == request.username).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username already taken")

    new_user = model.User(
        username=request.username,
        email=request.email,
        password=Hash.hash_password(request.password),
    )

    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
# Rollback the current transaction in progress.
# If no transaction is in progress, this method is a pass-through.
# The method always rolls back the topmost database transaction, discarding any nested transactions that may be in progress.
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username or email already in use")
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schema.Token)
def login(request: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    identifier = request.username.strip()
    user = (
        db.query(model.User).filter(or_(model.User.username == identifier, model.User.email == identifier.lower())).first()
    )

    if not user or not Hash.verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = token.create_access_token(
        data={
        "sub": user.username
        })

    return {
        "access_token": access_token, 
        "token_type": "bearer"
        }