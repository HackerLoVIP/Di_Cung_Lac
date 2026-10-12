import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, GoogleLoginRequest, Token, UserResponse
from app.services.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email nay da duoc dang ky"
        )
    
    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoac mat khau khong dung",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
def login_with_google(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    email = req.email
    full_name = req.full_name
    avatar_url = req.avatar_url

    # Neu co credential (Google ID Token), goi Google API de xac thuc
    if req.credential:
        try:
            resp = httpx.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={req.credential}",
                timeout=10.0
            )
            if resp.status_code == 200:
                payload = resp.json()
                email = payload.get("email")
                full_name = payload.get("name") or payload.get("given_name")
                avatar_url = payload.get("picture")
            else:
                print(f"[WARN] Google tokeninfo status: {resp.status_code}")
        except Exception as e:
            print(f"[WARN] Khong the ket noi Google tokeninfo: {e}")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Khong the xac thuc thong tin Google tai khoan"
        )

    # Tim hoac tao nguoi dung
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash=get_password_hash("google_auth_oauth_secret"),
            full_name=full_name or email.split("@")[0],
            avatar_url=avatar_url,
            role="user"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
            db.commit()
            db.refresh(user)

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
