import React, { useEffect, useState } from 'react';
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
    width: '26%',
    backgroundColor: '#3b4252',
    padding: '10px',
    borderRadius: '5px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px', // 상하 공간 간격
  },
  dealerSection: {
    flex: 7, // 딜러 공간 비율
    backgroundColor: '#4c566a',
    borderRadius: '5px',
    padding: '10px',
    overflowY: 'auto', // 스크롤 활성화
  },
  supportSection: {
    flex: 3, // 서포터 공간 비율
    backgroundColor: '#4c566a',
    borderRadius: '5px',
    padding: '10px',
    overflowY: 'auto', // 스크롤 활성화
  },
  sectionTitle: {
    display: 'flex',
    justifyContent: 'center', // 제목과 수정 버튼을 가운데 정렬
    alignItems: 'center', // 수직 방향 정렬
    position: 'relative', // 삭제 버튼의 절대 위치를 기준으로 설정
    backgroundColor: '#4c566a',
    color: 'white',
    textAlign: 'center',
    padding: '5px',
    borderRadius: '4px',
    marginBottom: '10px',
  },

  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // 두 개의 항목을 가로로 배치
    gap: '20px', // 항목 간의 간격
    flex: 1,
    width: '60%',
    overflowY: 'auto', // 세로로 스크롤 활성화
    height: '100%', // 부모의 높이를 가득 채우도록 설정
    alignContent: 'start', // 그리드 항목을 위쪽부터 배치
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
    gap: '10px', // 딜러와 서포터 공간 사이 간격 추가
  },
  dealerBoxSection: {
    flex: 6, // 딜러 공간 비율
    backgroundColor: '#5e81ac',
    borderRadius: '4px',
    padding: '5px',
    overflowY: 'auto',
  },
  supportBoxSection: {
    flex: 2, // 서포터 공간 비율
    backgroundColor: '#5e81ac',
    borderRadius: '4px',
    padding: '5px',
    overflowY: 'auto',
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
    gridTemplateColumns: 'repeat(2, 1fr)', // 한 줄에 2개의 열 생성
    gap: '10px', // 아이템 간의 간격 설정
    alignItems: 'start', // 상단 정렬
    justifyItems: 'center', // 아이템 가운데 정렬
    padding: '5px',
  },
  item: {
    backgroundColor: '#88c0d0',
    textAlign: 'center',
    borderRadius: '4px',
    padding: '5px',
    margin: '5px 0',
    height: '40px',
    display: 'flex', // 이미지나 텍스트를 수평으로 배치하려면 flex를 사용
    alignItems: 'center', // 수직 가운데 정렬
    justifyContent: 'center', // 수평 가운데 정렬
  },
  daysContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gridColumn: '1 / -1',
    marginBottom: '10px',
    position: 'sticky', // 스크롤 시 고정
    top: '0', // 상단에 고정
    zIndex: 1000, // 다른 요소보다 위에 표시
    backgroundColor: '#444', // 배경색 지정 (고정된 상태에서 배경 유지)
    padding: '10px 20px',
    borderBottom: '1px solid #555', // 하단 경계선 추가 (시각적 구분)
    height: '70px',
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
    justifyContent: 'center',
    backgroundColor: '#88c0d0',
    textAlign: 'center',
    borderRadius: '4px',
    padding: '5px',
    height: '50px',
    width: '100%', // 부모 컨테이너의 너비에 맞춤
    boxSizing: 'border-box', // 패딩 포함하여 크기 계산
    position: 'relative', // 자식 요소(이미지)가 컨테이너 내에서 위치를 기준으로 설정
  },
  characterImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    position: 'absolute', // 절대 위치
    left: '3px', // 왼쪽 구석에서 간격
  },
  removeButton: {
    backgroundColor: 'red',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginLeft: '10px', // 기존 왼쪽 여백
    marginRight: '5px', // 오른쪽 여백 추가
    borderRadius: '4px',
    position: 'absolute', // 절대 위치
    right: '5px', // 오른쪽 구석에서 간격 설정
    top: '50%', // 세로 방향 가운데 정렬
    transform: 'translateY(-50%)', // 세로 가운데 정렬
    transition: 'background-color 0.3s',
    width: '20px', // 버튼 크기 (너비)
    height: '20px', // 버튼 크기 (높이)
    alignItems: 'center', // 세로 가운데 정렬
    justifyContent: 'center', // 가로 가운데 정렬
    padding: '0', // 내부 여백 제거
  },
  removeButtonHover: {
    backgroundColor: '#ff9999', // 호버 시 더 진한 빨간색
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#2e3440',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '300px',
    textAlign: 'center',
  },
  modalInput: {
    width: '80%',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '4px',
    border: '1px solid #5e81ac',
    backgroundColor: '#3b4252',
    color: 'white',
  },
  modalButton: {
    padding: '10px 20px',
    margin: '5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#5e81ac',
    color: 'white',
  },
  editTitleButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    marginLeft: '10px',
    fontSize: '18px', // 이모지가 잘 보이도록 크기 조정
    padding: '5px',
    color: '#5e81ac',
    transition: 'transform 0.2s, color 0.2s',
  },
  editTitleButtonHover: {
    color: '#88c0d0',
    transform: 'scale(1.2)', // 호버 시 살짝 확대
  },
  removeBoxButton: {
    position: 'absolute', // 부모 컨테이너의 relative 위치를 기준으로 절대 위치 설정
    right: '10px', // 오른쪽 여백
    top: '50%', // 수직 가운데 정렬
    transform: 'translateY(-50%)', // 수직 가운데 정렬 보정
    backgroundColor: 'red',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '50%',
    fontSize: '14px',
  },
  dayButton: {
    backgroundColor: '#3b4252', // 기본 배경색
    color: '#ffffff', // 텍스트 색상
    border: '1px solid #5e81ac', // 테두리
    borderRadius: '5px', // 버튼 모서리를 둥글게
    padding: '10px 15px', // 패딩 추가
    cursor: 'pointer',
    fontSize: '14px', // 글자 크기
    fontWeight: 'bold', // 글자 굵기
    transition: 'all 0.3s ease', // 부드러운 전환 효과
    margin: '0 5px', // 버튼 간격
  },
  activeDayButton: {
    backgroundColor: '#88c0d0', // 선택된 버튼 배경색
    color: '#2e3440', // 선택된 버튼 텍스트 색상
    border: '1px solid #88c0d0', // 선택된 버튼 테두리
    fontSize: '14px',
    fontWeight: 'bold',
    transform: 'scale(1.1)', // 크기를 살짝 키워 강조
    transition: 'all 0.3s ease', // 부드러운 전환 효과
  },
  characterText: {
    display: 'flex', // 플렉스 컨테이너로 설정
    flexDirection: 'column', // 수직 방향으로 정렬
    alignItems: 'center', // 가로 방향 가운데 정렬
    justifyContent: 'center', // 세로 방향 가운데 정렬
    textAlign: 'center', // 텍스트 가운데 정렬
    fontSize: '14px', // 텍스트 크기 조정
    lineHeight: '1.5', // 줄 간격 조정
    color: '#2e3440', // 텍스트 색상 (필요에 따라 변경)
  },
  confirmButton: {
    padding: '10px 20px',
    margin: '5px',
    backgroundColor: 'red',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '10px 20px',
    margin: '5px',
    backgroundColor: 'gray',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

const DragAndDrop = () => {
  const [leftItems, setLeftItems] = useState([]);
  const [rightBoxes, setRightBoxes] = useState([
    {
      id: 'box-1',
      title: '입력하삼',
      day: '수',
      dealers: [],
      supports: [],
    },
  ]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [activeDay, setActiveDay] = useState('수'); // 기본 활성화 요일
  const [nickname, setNickname] = useState(''); // 닉네임 상태 추가
  const [dealers, setDealers] = useState([]);
  const [supports, setSupports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null); // 삭제할 캐릭터 정보
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [boxToDelete, setBoxToDelete] = useState(null); // 삭제할 박스 정보

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  console.log(dealers);
  console.log(supports);

  const getAllCharacter = async () => {
    const { data } = await axios.get(API.getAllCharacters);
    console.log(data);

    data.forEach((el) => {
      const classImg = IMG[el.className];
      const newItem = {
        id: uuidv4(), // 고유한 아이디 생성
        name: el.nickName,
        level: el.level,
        className: el.className,
        classImg,
      };

      // 캐릭터 직업 이름에 따라 딜러/서포트로 분류
      if (['바드', '도화가', '홀리나이트'].includes(el.className)) {
        setSupports((prevItems) => [...prevItems, newItem]);
        setLeftItems((prevItems) => [...prevItems, newItem]);
      } else {
        setDealers((prevItems) => [...prevItems, newItem]);
        setLeftItems((prevItems) => [...prevItems, newItem]);
      }
    });
  };

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
        name: nickName,
        level: level,
        className,
        classImg,
      };

      if (['바드', '도화가', '홀리나이트'].includes(className)) {
        setSupports((prevItems) => [...prevItems, newItem]);
        setLeftItems((prevItems) => [...prevItems, newItem]);
      } else {
        setDealers((prevItems) => [...prevItems, newItem]);
        setLeftItems((prevItems) => [...prevItems, newItem]);
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data === 'Character already exists.'
      ) {
        alert('이 캐릭터는 이미 존재합니다.');
      } else {
        console.error('Character info fetch error:', error);
        alert('캐릭터 정보를 가져오는 중 오류가 발생했습니다.');
      }
    }
  };

  useEffect(() => {
    getAllCharacter();
    getBoxes(activeDay);
  }, []);

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

  const addBox = async () => {
    await axios
      .post(API.addRaidGroup, null, {
        params: {
          day: activeDay,
        },
      })
      .then(({ data }) => {
        console.log(data);
        setRightBoxes([
          ...rightBoxes,
          {
            id: data.id,
            title: '입력하삼',
            day: activeDay,
            dealers: [],
            supports: [],
          },
        ]);
      });
  };

  const getBoxes = async (day) => {
    setActiveDay(day);

    try {
      const { data } = await axios.get(API.getRaidGroups, {
        params: {
          day: day,
        },
      });
      console.log(data);

      const newBoxes = data.map((item) => ({
        id: item.raidGroupId,
        title: item.name || '입력하삼',
        day: item.day,
        dealers: item.characters
          .filter(
            (character) =>
              !['바드', '도화가', '홀리나이트'].includes(character.className)
          )
          .map((character) => {
            const classImg = IMG[character.className]; // 이미지 매핑
            return {
              id: uuidv4(), // 고유한 아이디 생성
              name: character.nickName,
              level: character.level,
              className: character.className,
              classImg,
            };
          }),
        supports: item.characters
          .filter((character) =>
            ['바드', '도화가', '홀리나이트'].includes(character.className)
          )
          .map((character) => {
            const classImg = IMG[character.className]; // 이미지 매핑
            return {
              id: uuidv4(), // 고유한 아이디 생성
              name: character.nickName,
              level: character.level,
              className: character.className,
              classImg,
            };
          }),
      }));

      setRightBoxes(newBoxes);

      console.log('박스가 성공적으로 추가되었습니다:', newBoxes);
    } catch (error) {
      console.error('오류 발생:', error);
    }
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
      const targetBox = updatedBoxes[boxIndex];

      // 중복 검사
      const isDuplicate =
        targetBox.dealers.some((existingItem) => existingItem.id === item.id) ||
        targetBox.supports.some((existingItem) => existingItem.id === item.id);

      if (isDuplicate) {
        alert('이 아이템은 이미 추가되었습니다.');
        return;
      }

      if (['바드', '도화가', '홀리나이트'].includes(item.className)) {
        if (targetBox.supports.length >= 2) {
          alert('서포터 슬롯이 가득 찼습니다.');
          return;
        }
        targetBox.supports.push(item);
      } else {
        if (targetBox.dealers.length >= 6) {
          alert('딜러 슬롯이 가득 찼습니다.');
          return;
        }
        targetBox.dealers.push(item);
      }
      axios
        .post(API.addCharacterToRaidGroup, null, {
          params: {
            raidGroupId: boxId,
            characterName: item.name,
          },
        })
        .then(() => {
          setRightBoxes(updatedBoxes);
        });
    }
  };

  const removeItem = async (boxId, itemId, type, nickName) => {
    await axios
      .delete(API.deleteCharactersFromRaid, {
        params: {
          raidGroupId: boxId,
          characterName: nickName,
        },
      })
      .then(() => {
        setRightBoxes((prevBoxes) =>
          prevBoxes.map((box) =>
            box.id === boxId
              ? {
                  ...box,
                  dealers: box.dealers.filter((item) => item.id !== itemId),
                  supports: box.supports.filter((item) => item.id !== itemId),
                }
              : box
          )
        );
      });
  };

  const confirmDeleteBox = async () => {
    if (boxToDelete !== null) {
      try {
        await axios.delete(API.deleteRaid, {
          params: {
            raidGroupId: boxToDelete,
          },
        });

        // 로컬 상태에서 박스 제거
        setRightBoxes((prevBoxes) =>
          prevBoxes.filter((box) => box.id !== boxToDelete)
        );
      } catch (error) {
        console.error('박스 삭제 중 오류 발생:', error);
        alert('박스를 삭제하는 중 문제가 발생했습니다.');
      } finally {
        // 모달 닫기
        setIsBoxModalOpen(false);
        setBoxToDelete(null);
      }
    }
  };

  const openBoxDeleteModal = (boxId) => {
    setBoxToDelete(boxId); // 삭제할 박스 ID 설정
    setIsBoxModalOpen(true); // 모달 열기
  };

  const confirmDeleteCharacter = async (id, type, nickName) => {
    if (characterToDelete) {
      const { id, type, nickName } = characterToDelete;

      try {
        await axios.delete(`${API.deleteCharacters}/${nickName}`);

        // 상태 업데이트
        if (type === 'dealers') {
          setDealers((prev) => prev.filter((item) => item.id !== id));
        } else if (type === 'supports') {
          setSupports((prev) => prev.filter((item) => item.id !== id));
        }
      } catch (error) {
        console.error('캐릭터 삭제 중 오류 발생:', error);
        alert('캐릭터를 삭제하는 중 오류가 발생했습니다.');
      }
    }

    // 모달 닫기
    setIsModalOpen(false);
    setCharacterToDelete(null);
  };

  const openDeleteModal = (id, type, nickName) => {
    setCharacterToDelete({ id, type, nickName }); // 삭제 대상 설정
    setIsModalOpen(true); // 모달 열기
  };

  return (
    <div style={styles.container}>
      {/* 왼쪽 패널 */}
      <div style={styles.leftPanel}>
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

        {/* 딜러 섹션 */}
        <div style={styles.dealerSection}>
          <div style={styles.sectionTitle}>딜러</div>
          <div style={styles.itemContainer}>
            {dealers.map((item) => (
              <div
                key={item.id}
                style={styles.characterItem}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
              >
                <button
                  onClick={() => openDeleteModal(item.id, 'dealers', item.name)}
                  style={styles.removeButton}
                >
                  x
                </button>
                <img
                  src={item.classImg}
                  alt="character"
                  style={styles.characterImage}
                />
                <div style={styles.characterText}>
                  {item.name}
                  <br />
                  {item.level}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 서포트 섹션 */}
        <div style={styles.supportSection}>
          <div style={styles.sectionTitle}>서포터</div>
          <div style={styles.itemContainer}>
            {supports.map((item) => (
              <div
                key={item.id}
                style={styles.characterItem}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
              >
                <button
                  onClick={() =>
                    openDeleteModal(item.id, 'supports', item.name)
                  }
                  style={styles.removeButton}
                >
                  x
                </button>
                <img
                  src={item.classImg}
                  alt="character"
                  style={styles.characterImage}
                />
                <div style={styles.characterText}>
                  {item.name}
                  <br />
                  {item.level}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 가운데 영역 */}
      <div style={styles.gridContainer}>
        <div style={styles.daysContainer}>
          <div style={{ flex: 0.1 }}></div>

          <div style={{ display: 'flex', gap: '5px' }}>
            {days.map((day) => (
              <button
                key={day}
                onClick={() => getBoxes(day)}
                style={{
                  ...styles.dayButton,
                  ...(activeDay === day
                    ? { backgroundColor: '#88c0d0', color: 'white' }
                    : {}),
                }}
              >
                {day}
              </button>
            ))}
          </div>
          <button onClick={addBox} style={styles.addButton}>
            +
          </button>
        </div>

        {rightBoxes
          .filter((box) => box.day === activeDay)
          .map((box) => (
            <div key={box.id} style={styles.rightBox}>
              <div style={styles.sectionTitle}>
                {box.title}
                <button
                  onClick={() => handleOpenPopup(box.id)}
                  style={{
                    ...styles.editTitleButton,
                    ...(isPopupOpen && styles.editTitleButtonHover),
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.2)';
                    e.target.style.color = '#88c0d0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.color = '#5e81ac';
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => openBoxDeleteModal(box.id)} // 박스 삭제 모달 열기
                  style={styles.removeBoxButton}
                >
                  x
                </button>
              </div>

              {/* 딜러 섹션 */}
              <div
                style={styles.dealerBoxSection}
                onDrop={(e) => handleDrop(e, box.id)}
                onDragOver={(e) => e.preventDefault()}
              >
                <div style={styles.itemContainer}>
                  {box.dealers.map((item) => (
                    <div key={item.id} style={styles.characterItem}>
                      <img
                        src={item.classImg}
                        alt="character"
                        style={styles.characterImage}
                      />
                      <div>
                        {item.name}
                        <br />
                        {item.level}
                      </div>

                      <button
                        onClick={() =>
                          removeItem(box.id, item.id, 'dealers', item.name)
                        }
                        style={styles.removeButton}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 서포터 섹션 */}
              <div
                style={styles.supportBoxSection}
                onDrop={(e) => handleDrop(e, box.id)}
                onDragOver={(e) => e.preventDefault()}
              >
                <div style={styles.itemContainer}>
                  {box.supports.map((item) => (
                    <div key={item.id} style={styles.characterItem}>
                      <img
                        src={item.classImg}
                        alt="character"
                        style={styles.characterImage}
                      />
                      <div>
                        {item.name}
                        <br />
                        {item.level}
                      </div>
                      <button
                        onClick={() =>
                          removeItem(box.id, item.id, 'supports', item.name)
                        }
                        style={styles.removeButton}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>삭제 확인</h3>
            <p>삭제하시겠습니까?</p>
            <div>
              <button
                style={styles.confirmButton}
                onClick={confirmDeleteCharacter}
              >
                확인
              </button>
              <button
                style={styles.cancelButton}
                onClick={() => setIsModalOpen(false)} // 모달 닫기
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {isBoxModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>삭제 확인</h3>
            <p>이 박스를 삭제하시겠습니까?</p>
            <div>
              <button style={styles.confirmButton} onClick={confirmDeleteBox}>
                확인
              </button>
              <button
                style={styles.cancelButton}
                onClick={() => {
                  setIsBoxModalOpen(false);
                  setBoxToDelete(null); // 모달 닫기
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 팝업 모달 */}
      {isPopupOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>제목 수정</h3>
            <input
              type="text"
              placeholder="새 제목 입력"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={styles.modalInput}
            />
            <div>
              <button style={styles.modalButton} onClick={handleSaveTitle}>
                저장
              </button>
              <button
                style={{ ...styles.modalButton, backgroundColor: 'red' }}
                onClick={() => setIsPopupOpen(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragAndDrop;
