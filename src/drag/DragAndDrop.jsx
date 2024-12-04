import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { API } from '../api/api';
import { v4 as uuidv4 } from 'uuid';
import 브레이커 from '../img/브레이커.png';
import 건슬링어 from '../img/건슬링어.png';
import 기공사 from '../img/기공사.png';
import 기상술사 from '../img/기상술사.png';
import 데모닉 from '../img/데모닉.png';
import 데빌헌터 from '../img/데빌헌터.png';
import 도화가 from '../img/도화가.png';
import 디트로이드 from '../img/디트로이드.png';
import 리퍼 from '../img/리퍼.png';
import 바드 from '../img/바드.png';
import 배틀마스터 from '../img/배틀마스터.png';
import 버서커 from '../img/버서커.png';
import 블레이드 from '../img/블레이드.png';
import 블래스터 from '../img/블래스터.png';
import 서머너 from '../img/서머너.png';
import 소서리스 from '../img/소서리스.png';
import 소울이터 from '../img/소울이터.png';
import 스카우터 from '../img/스카우터.png';
import 스트라이커 from '../img/스트라이커.png';
import 슬레이어 from '../img/슬레이어.png';
import 아르카나 from '../img/아르카나.png';
import 워로드 from '../img/워로드.png';
import 인파이터 from '../img/인파이터.png';
import 창술사 from '../img/창술사.png';
import 호크아이 from '../img/호크아이.png';
import 홀리나이트 from '../img/홀리나이트.png';

const IMG = {
  브레이커: 브레이커,
  건슬링어: 건슬링어,
  기공사: 기공사,
  기상술사: 기상술사,
  데모닉: 데모닉,
  데빌헌터: 데빌헌터,
  도화가: 도화가,
  디트로이드: 디트로이드,
  리퍼: 리퍼,
  바드: 바드,
  배틀마스터: 배틀마스터,
  버서커: 버서커,
  블레이드: 블레이드,
  블래스터: 블래스터,
  서머너: 서머너,
  소서리스: 소서리스,
  소울이터: 소울이터,
  스카우터: 스카우터,
  스트라이커: 스트라이커,
  슬레이어: 슬레이어,
  아르카나: 아르카나,
  워로드: 워로드,
  인파이터: 인파이터,
  호크아이: 호크아이,
  창술사: 창술사,
  홀리나이트: 홀리나이트,
};

const styles = {
  // 기존 스타일들
  container: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#444',
    height: '100vh',
    color: 'white',
  },
  leftPanel: {
    width: '20%',
    backgroundColor: '#3b4252',
    padding: '10px',
    borderRadius: '5px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // 두 개의 항목을 가로로 배치
    gap: '20px', // 항목 간의 간격
    flex: 1,
    width: '60%',
    overflowY: 'auto', // 세로로 스크롤 활성화
    height: '100%', // 부모의 높이를 가득 채우도록 설정
  },
  rightPanel: {
    width: '5%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  rightBox: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#81a1c1',
    borderRadius: '4px',
    padding: '10px',
    height: '400px',
    position: 'relative',
  },
  boxTitle: {
    backgroundColor: '#4c566a',
    color: 'white',
    textAlign: 'center',
    padding: '5px',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  itemContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    flex: 1,
    height: '100%',
  },
  item: {
    backgroundColor: '#88c0d0',
    textAlign: 'center',
    borderRadius: '4px',
    padding: '5px',
    margin: '5px 0',
    height: '20px',
    display: 'flex', // 이미지나 텍스트를 수평으로 배치하려면 flex를 사용
    alignItems: 'center', // 수직 가운데 정렬
    justifyContent: 'center', // 수평 가운데 정렬
  },
  daysContainer: {
    display: 'flex',
    justifyContent: 'center', // 가로로 가운데 정렬
    gridColumn: '1 / -1', // 전체 열을 차지
    marginBottom: '10px', // 아래 항목들과 간격을 준다
    height: '20px', // 높이를 줄여서 공간을 절약
    alignItems: 'center', // 버튼들이 세로로 가운데 정렬되도록 함
    padding: '0 10px', // 좌우 여백 조정
  },
  addButton: {
    padding: '10px',
    backgroundColor: '#5e81ac',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px',
    height: '50px',
  },
  addCharButton: {
    padding: '10px',
    backgroundColor: '#5e81ac',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px',
    height: '40px',
  },
  addInput: {
    padding: '10px',
    backgroundColor: '#3b4252',
    color: 'white',
    border: '1px solid #5e81ac',
    borderRadius: '5px',
    width: '60%',
    marginRight: '10px',
  },
  characterItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#88c0d0',
    textAlign: 'center',
    borderRadius: '4px',
    padding: '5px',
    margin: '5px 0',
    height: '40px',
  },
  characterImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '10px',
  },
  editTitleButton: {
    backgroundColor: '#4c566a',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '10px',
  },
};

const DragAndDrop = () => {
  const [leftItems, setLeftItems] = useState([]);
  const [rightBoxes, setRightBoxes] = useState([
    { id: 'box-1', title: 'Box 1', day: 'Mon', items: [] },
    { id: 'box-2', title: 'Box 2', day: 'Tue', items: [] },
    // { id: 'box-3', title: 'Box 3', day: 'Wed', items: [] },
    // { id: 'box-4', title: 'Box 4', day: 'Thu', items: [] },
    // { id: 'box-5', title: 'Box 5', day: 'Fri', items: [] },
  ]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [activeDay, setActiveDay] = useState('Mon'); // 기본 활성화 요일
  const [nickname, setNickname] = useState(''); // 닉네임 상태 추가

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getAllCharacter = async () => {
    const { data } = await axios.get(API.getAllCharacters);
    console.log(data);

    data.forEach((el) => {
      const classImg = IMG[el.className];
      const newItem = {
        id: uuidv4(), // 고유한 아이디 생성
        name: `${el.nickName} ${el.level}`,
        classImg,
      };

      setLeftItems((prevItems) => [...prevItems, newItem]);
    });
  };

  useEffect(() => {
    getAllCharacter();
  }, []);

  // 직업 정보 가져오기
  const getCharacterInfo = async () => {
    try {
      const { data } = await axios.get(API.getCharater, {
        params: { characterName: nickname }, // 입력된 닉네임을 파라미터로 전송
      });
      console.log(data);

      const { className, level, nickName } = data; // 예시로 서버에서 받은 데이터

      const classImg = IMG[className];
      // 새로운 아이템 추가
      const newItem = {
        id: uuidv4(), // 고유한 아이디 생성
        name: `${nickName} ${level}`,
        classImg,
      };

      setLeftItems((prevItems) => [...prevItems, newItem]);
    } catch (error) {
      console.error('Character info fetch error:', error);
    }
  };

  const handleOpenPopup = (boxId) => {
    setSelectedBoxId(boxId);
    setIsPopupOpen(true);
  };

  const handleSaveTitle = () => {
    setRightBoxes((prev) =>
      prev.map((box) =>
        box.id === selectedBoxId ? { ...box, title: newTitle } : box
      )
    );
    setIsPopupOpen(false);
    setNewTitle('');
  };

  const addBox = () => {
    const newBoxId = `box-${rightBoxes.length + 1}`;
    setRightBoxes([
      ...rightBoxes,
      {
        id: newBoxId,
        title: `Box ${rightBoxes.length + 1}`,
        day: 'Mon',
        items: [],
      },
    ]);
  };

  const handleDragStart = (e, itemId) => {
    e.dataTransfer.setData('itemId', itemId);
  };

  // 드래그 종료 시 호출
  const handleDrop = (e, boxId) => {
    const itemId = e.dataTransfer.getData('itemId');
    const item = leftItems.find((item) => item.id === itemId);
    const boxIndex = rightBoxes.findIndex((box) => box.id === boxId);

    if (boxIndex !== -1) {
      const updatedBoxes = [...rightBoxes];
      updatedBoxes[boxIndex].items.push(item);
      setRightBoxes(updatedBoxes);

      // leftItems에서 제거
      setLeftItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      );
    }
  };

  return (
    <div style={styles.container}>
      {/* 왼쪽 패널 */}
      <div
        // ref={provided.innerRef}
        // {...provided.droppableProps}
        style={styles.leftPanel}
      >
        {/* 닉네임 입력 필드 */}
        <input
          type="text"
          placeholder="닉네임 입력"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={styles.addInput}
        />
        {/* + 버튼 */}
        <button style={styles.addCharButton} onClick={getCharacterInfo}>
          + 캐릭터 추가
        </button>

        {/* 아이템 목록 */}
        <div style={styles.itemContainer}>
          {leftItems.map((item) => (
            <div
              key={item.id}
              style={styles.characterItem}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
            >
              <img
                src={item.classImg}
                alt="character"
                style={styles.characterImage}
              />
              <div>{item.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 가운데 영역 */}
      <div style={styles.gridContainer}>
        <div style={styles.daysContainer}>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              style={{
                ...styles.dayButton,
                ...(activeDay === day ? styles.activeDayButton : {}),
              }}
            >
              {day}
            </button>
          ))}
        </div>
        {rightBoxes.map((box, index) => (
          <div key={box.id} style={styles.rightBox}>
            <div style={styles.boxTitle}>
              {box.title}
              <button
                onClick={() => handleOpenPopup(box.id)}
                style={styles.editTitleButton}
              >
                제목 수정
              </button>
            </div>
            <div
              key={box.id}
              onDrop={(e) => handleDrop(e, box.id)}
              onDragOver={(e) => e.preventDefault()}
              style={styles.itemContainer}
            >
              {box.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  style={styles.item}
                >
                  <img
                    src={item.classImg}
                    alt="character"
                    style={styles.characterImage}
                  />
                  <div>{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 오른쪽 패널 */}
      <div style={styles.rightPanel}>
        <button onClick={addBox} style={styles.addButton}>
          새 박스 추가
        </button>
      </div>
    </div>
  );
};

export default DragAndDrop;
