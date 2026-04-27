import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

// --- Helper Functions & Constants ---
const shuffle = (array) => { let c = array.length, r; while (c !== 0) { r = Math.floor(Math.random() * c); c--; [array[c], array[r]] = [array[r], array[c]]; } return array; };
const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
const SCROLLING_CHARS = shuffle([...ID_CHARS, ...ID_CHARS, ...ID_CHARS]);
const PW_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'.split('');
const ID_GRAVITY = 0.2;
const PW_GRAVITY = 1.5;
const THROW_SENSITIVITY = 30;
const REQUIRED_PHRASE = '나는 바보입니다';
const TAUNTS = [
  "하아.. 하아.. 쥐났음 ㅠㅠ 진짜 못 움직임 빨리 누르셈",
  "헥헥... 형님 피지컬 폼 미쳤다... 저 이제 포기함 O-<-<",
  "아 발목 삐었음;; 못 도망감 ㅠㅠ (진짜임)",
  "항복!! 🙌 더 이상 갈 데도 없음 ㅠㅠ (사실 있음)",
  "아 ㅋㅋ 이번엔 진짜 안 튐 (내 손모가지 건다)",
  "형님, 찐으로 무릎 꿇었습니다. 여기서 딱 대기탑니다.",
  "이번에 피하면 내가 님 똥개임 왈왈! 🐶",
  "진짜 맹세코 이번 한 번만 가만히 있겠습니다 충성충성",
  "아 쫌! 구라 안 치고 이제 진짜 안 도망간다고 ㅋㅋㅋ",
  "눈 딱 감고 한 번만 맞아줌 ㅋㅋ 빨리 치셈",
  "아 ㅋㅋ 속는 셈 치고 한 번만 더 와보셈 (진짜 안 피함)",
  "진짜 마지막 양심 선언: 여기서 딱 1초 대기함. 빨리!"
];

// --- Child Components ---
const LetterTile = React.memo(({ char, onMount }) => { const ref = useRef(null); useEffect(() => { if (ref.current) onMount(ref); }, [onMount]); return <div ref={ref} className="letter-tile">{char}</div>; });

function App() {
  // --- State ---
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [agreementText, setAgreementText] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState('');
  const [dart, setDart] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [drops, setDrops] = useState([]);
  const [basketX, setBasketX] = useState(225);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0, position: 'static' });
  const [btnScale, setBtnScale] = useState(1);
  const [btnText, setBtnText] = useState('가입 완료');
  const [fakeButtons, setFakeButtons] = useState([]);

  // --- Refs ---
  const idGameAreaRef = useRef(null);
  const idTargetRefs = useRef([]);
  const pwGameAreaRef = useRef(null);
  const animationFrameId = useRef(null);
  const basketXRef = useRef(basketX);
  const dartRef = useRef(null);
  const dropsRef = useRef([]);

  // --- Callbacks & Handlers ---
  const handleIdTargetMount = useCallback((index, ref) => { idTargetRefs.current[index] = ref; }, []);
  const handleBasketMove = (e) => { if (!pwGameAreaRef.current) return; const rect = pwGameAreaRef.current.getBoundingClientRect(); const newX = e.clientX - rect.left - 50; const clampedX = Math.max(0, Math.min(newX, rect.width - 100)); setBasketX(clampedX); basketXRef.current = clampedX; };
  const handleToggleShowPassword = () => { if (!showPassword) { const newRevealed = password.split('').map(char => Math.random() > 0.5 ? char : '*').join(''); setRevealedPassword(newRevealed); } setShowPassword(!showPassword); };
  const handlePaste = (e) => { e.preventDefault(); alert('붙여넣기는 허용되지 않습니다!'); };

  const handleButtonMouseOver = (e) => {
    const btn = e.target;
    if (btn.className !== 'submit-btn') return;
    
    const rect = btn.getBoundingClientRect();
    const currentX = rect.left + window.scrollX;
    const currentY = rect.top + window.scrollY;

    const randomX = Math.floor(Math.random() * (window.innerWidth - 150));
    const randomY = Math.floor(Math.random() * (window.innerHeight - 50));

    setBtnPos({ x: randomX, y: randomY, position: 'fixed' });
    setBtnScale(s => Math.max(0.3, s - 0.05));

    if (fakeButtons.length < 10 && btnPos.position !== 'static') {
      setFakeButtons(prev => [...prev, { id: Date.now() + Math.random(), x: currentX, y: currentY }]);
    }
  };

  const handleButtonFocus = (e) => e.target.blur();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('앗, 잡혔다!\n\n...하지만 아쉽게도 모든 폼이 초기화되었습니다 ^^ 처음부터 다시 입력해주세요.');
    setId('');
    setPassword('');
    setPasswordConfirm('');
    setAgreementText('');
    setAgreed(false);
    setBtnPos({ x: 0, y: 0, position: 'static' });
    setBtnText('가입 완료');
    setBtnScale(1);
    setFakeButtons([]);
    setFormError('');
  };

  const getCoords = (e, ref) => { const rect = ref.current.getBoundingClientRect(); return { x: e.clientX - rect.left, y: e.clientY - rect.top }; };
  const handleMouseDown = (e) => {
    if (dartRef.current) return;
    const coords = getCoords(e, idGameAreaRef);
    if (coords.y < 400) return; // 상단 400px은 드래그 시작 불가
    setDragStart(coords);
    setDragEnd(coords);
  };
  const handleMouseMove = (e) => { if (dragStart && !dartRef.current) setDragEnd(getCoords(e, idGameAreaRef)); };
  const handleMouseUp = () => { if (dragStart && dragEnd && !dartRef.current) { const dx = dragStart.x - dragEnd.x; const dy = dragStart.y - dragEnd.y; if (Math.abs(dx) > 5 || Math.abs(dy) > 5) { const newDart = { x: dragStart.x, y: dragStart.y, vx: dx / THROW_SENSITIVITY, vy: dy / THROW_SENSITIVITY }; dartRef.current = newDart; setDart(newDart); } } setDragStart(null); setDragEnd(null); };

  // --- Game Logic ---
  useEffect(() => {
    const dropInterval = setInterval(() => {
      if (dropsRef.current.length < 10 && pwGameAreaRef.current) {
        const newDrop = { id: Date.now() + Math.random(), char: PW_CHARS[Math.floor(Math.random() * PW_CHARS.length)], x: Math.random() * (pwGameAreaRef.current.clientWidth - 20), y: 0 };
        dropsRef.current = [...dropsRef.current, newDrop];
        setDrops(dropsRef.current);
      }
    }, 1000);
    return () => clearInterval(dropInterval);
  }, []);

  useEffect(() => {
    const gameLoop = () => {
      // 1. Update Dart
      if (dartRef.current) {
        const currentDart = dartRef.current;
        const gameAreaRect = idGameAreaRef.current?.getBoundingClientRect();
        if (gameAreaRect) {
          const newVy = currentDart.vy + ID_GRAVITY;
          const newY = currentDart.y + newVy;
          const newX = currentDart.x + currentDart.vx;

          if (newY > gameAreaRect.height || newX < 0 || newX > gameAreaRect.width) {
            dartRef.current = null;
            setDart(null);
          } else {
            let hit = false;
            const dartRect = { x: newX - 7.5, y: newY - 7.5, width: 15, height: 15 };
            for (let i = 0; i < idTargetRefs.current.length; i++) {
              const targetRef = idTargetRefs.current[i];
              if (targetRef?.current) {
                const targetRect = targetRef.current.getBoundingClientRect();
                const adjustedTargetRect = { x: targetRect.left - gameAreaRect.left, y: targetRect.top - gameAreaRect.top, width: targetRect.width, height: targetRect.height };
                if (dartRect.x < adjustedTargetRect.x + adjustedTargetRect.width && dartRect.x + dartRect.width > adjustedTargetRect.x && dartRect.y < adjustedTargetRect.y + adjustedTargetRect.height && dartRect.y + dartRect.height > adjustedTargetRect.y) {
                  const char = SCROLLING_CHARS[i % SCROLLING_CHARS.length];
                  setId(prevId => prevId.length < 10 ? prevId + char : prevId);
                  dartRef.current = null;
                  setDart(null);
                  hit = true;
                  break;
                }
              }
            }
            if (!hit) {
              const updatedDart = { ...currentDart, x: newX, y: newY, vy: newVy };
              dartRef.current = updatedDart;
              setDart(updatedDart);
            }
          }
        }
      }

      // 2. Update Drops
      const gameAreaRect = pwGameAreaRef.current?.getBoundingClientRect();
      if (gameAreaRect) {
        const currentDrops = dropsRef.current;
        const remainingDrops = [];
        const caughtChars = [];
        
        for (const drop of currentDrops) {
          const newY = drop.y + PW_GRAVITY;
          if (newY > gameAreaRect.height) continue;

          const currentBasketX = basketXRef.current;
          const basketRect = { x: currentBasketX, y: gameAreaRect.height - 30, width: 100, height: 30 };
          if (drop.x + 10 > basketRect.x && drop.x < basketRect.x + basketRect.width && newY + 10 > basketRect.y && newY < basketRect.y + basketRect.height) {
            caughtChars.push(drop.char);
          } else {
            remainingDrops.push({ ...drop, y: newY });
          }
        }

        if (caughtChars.length > 0) {
          setPassword(p => (p + caughtChars.join('')).slice(0, 20));
        }
        dropsRef.current = remainingDrops;
        setDrops(remainingDrops);
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>세상에서 가장 킹받는 회원가입</h1>
        <form onSubmit={handleSubmit} className="signup-form">
          {formError && <p className="error-message">{formError}</p>}

          <div className="form-group">
            <label>아이디: {id || '드래그해서 작성해보세요!'}</label>
            <div ref={idGameAreaRef} className="game-area" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <div className="conveyor-belt"><div className="scrolling-row">{SCROLLING_CHARS.map((char, index) => <LetterTile key={index} char={char} onMount={(ref) => handleIdTargetMount(index, ref)} />)}</div><div className="scrolling-row">{SCROLLING_CHARS.map((char, index) => <LetterTile key={SCROLLING_CHARS.length + index} char={char} onMount={(ref) => handleIdTargetMount(SCROLLING_CHARS.length + index, ref)} />)}</div></div>
              <div className="drag-limit-line" style={{ top: '400px' }}></div>
              {dart && <div className="dart" style={{ left: `${dart.x}px`, top: `${dart.y}px` }} />}
              {dragStart && dragEnd && <svg className="drag-indicator"><line x1={dragStart.x} y1={dragStart.y} x2={dragEnd.x} y2={dragEnd.y} stroke="cyan" strokeWidth="2" /></svg>}
            </div>
            <button type="button" onClick={() => setId('')}>아이디 초기화</button>
          </div>

          <div className="form-group">
            <label>비밀번호: {showPassword ? revealedPassword : '*'.repeat(password.length)}</label>
            <div ref={pwGameAreaRef} className="password-game-area" onMouseMove={handleBasketMove}>
              {drops.map(d => <div key={d.id} className="falling-char" style={{ transform: `translate(${d.x}px, ${d.y}px)` }}>{d.char}</div>)}
              <div className="basket" style={{ transform: `translateX(${basketX}px)` }} />
            </div>
            <div className="pw-controls"><button type="button" onClick={() => setPassword('')}>비밀번호 초기화</button><button type="button" onClick={handleToggleShowPassword}>{showPassword ? '숨기기' : '보기'}</button></div>
          </div>

          <div className="form-group"><input type="password" placeholder="비밀번호 확인 (직접 입력!)" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} onPaste={handlePaste} required /></div>

          <div className="form-group">
            <textarea className="terms" readOnly value={`제1조. 본인은 이 서비스를 이용함으로써 발생하는 모든 킹받는 상황을 감수합니다.\n제2조. 아래 문장을 입력창에 똑같이 입력해야만 약관에 동의할 수 있습니다.\n\n"${REQUIRED_PHRASE}"`} />
            <input type="text" placeholder="여기에 따라 치세요..." className="agreement-input" value={agreementText} onChange={(e) => setAgreementText(e.target.value)} onPaste={handlePaste} />
            <div className="checkbox-group">
              <input type="checkbox" id="agreement" checked={agreed} onChange={() => setAgreed(!agreed)} disabled={agreementText !== REQUIRED_PHRASE} />
              <label htmlFor="agreement">위 약관에 동의하며, 모든 내용을 숙지하였습니다.</label>
            </div>
          </div>

          <div className="btn-container" style={{ height: '60px', position: 'relative' }}>
            <button 
              type="submit" 
              className="submit-btn" 
              onMouseOver={handleButtonMouseOver}
              onFocus={handleButtonFocus}
              style={{
                position: btnPos.position,
                left: btnPos.position === 'fixed' ? `${btnPos.x}px` : 'auto',
                top: btnPos.position === 'fixed' ? `${btnPos.y}px` : 'auto',
                transform: `scale(${btnScale})`,
                zIndex: 1000,
                transition: 'none'
              }}
            >
              {btnText}
            </button>
            {fakeButtons.map(btn => (
              <button 
                key={btn.id} 
                type="button" 
                className="fake-btn" 
                style={{ left: `${btn.x}px`, top: `${btn.y}px` }}
                onClick={() => alert('이건 제 잔상입니다만? 😎')}
              >
                가입 완료
              </button>
            ))}
          </div>
        </form>
      </header>
    </div>
  );
}

export default App;
