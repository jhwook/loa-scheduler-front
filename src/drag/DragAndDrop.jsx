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
import 환수사 from '../img/환수사.png';

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
  환수사: 환수사,
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
    height: '340px',
    gap: '10px', // 딜러와 서포터 공간 사이 간격 추가
  },
  dealerBoxSection: {
    flex: 6, // 딜러 공간 비율
    backgroundColor: '#5e81ac',
    borderRadius: '4px',
    padding: '5px',
    overflowY: 'auto',
    height: '220px',
  },
  supportBoxSection: {
    flex: 2, // 서포터 공간 비율
    backgroundColor: '#5e81ac',
    borderRadius: '4px',
    padding: '5px',
    overflowY: 'auto',
  },
  itemContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)', // 한 줄에 2개의 열 생성
    gap: '10px', // 아이템 간의 간격 설정
    alignItems: 'start', // 상단 정렬
    justifyItems: 'center', // 아이템 가운데 정렬
    padding: '5px',
    // height: '100%', // 부모(dealerBoxSection)의 높이를 채움
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
  boxTitle: {
    backgroundColor: '#4c566a',
    color: 'white',
    textAlign: 'center',
    padding: '5px',
    borderRadius: '4px',
    marginBottom: '10px',
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
  daysAndRaidsContainer: {
    display: 'flex',
    flexDirection: 'column', // 수직으로 배치
    gap: '10px', // 요일과 레이드 간 간격
    gridColumn: '1 / -1',
    position: 'sticky', // 상단 고정
    top: '0', // 상단 위치
    zIndex: 1000, // 다른 요소 위에 표시
    backgroundColor: '#444', // 배경색 유지
    padding: '10px 20px',
    borderBottom: '1px solid #555', // 구분선
  },
  daysContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px', // 요일과 레이드 간 간격 추가
  },
  raidsContainer: {
    display: 'flex',
    justifyContent: 'center', // 버튼을 가운데 정렬
    alignItems: 'center',
    gap: '10px', // 레이드 버튼 간 간격
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
  raidButton: {
    backgroundColor: '#3b4252',
    color: '#ffffff',
    border: '1px solid #5e81ac',
    borderRadius: '5px',
    padding: '10px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  },
  activeRaidButton: {
    backgroundColor: '#88c0d0',
    color: '#2e3440',
    border: '1px solid #88c0d0',
    fontSize: '14px',
    fontWeight: 'bold',
    transform: 'scale(1.1)',
    transition: 'all 0.3s ease',
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
  selectDropdown: {
    backgroundColor: '#4c566a',
    color: '#fff',
    border: '1px solid #5e81ac',
    borderRadius: '4px',
    padding: '5px',
    marginRight: '10px',
    cursor: 'pointer',
  },
  dayDisplay: {
    marginLeft: '10px', // 시간 선택 오른쪽 여백
    fontSize: '14px', // 텍스트 크기
    color: '#ffffff', // 텍스트 색상
    padding: '5px 10px', // 내부 여백
    backgroundColor: '#5e81ac', // 배경색
    borderRadius: '5px', // 둥근 테두리
    fontWeight: 'bold', // 굵은 글씨
    display: 'inline-block', // 인라인 블록으로 표시
    marginRight: '10px',
  },
  dayOption: {
    padding: '5px',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: '#5e81ac', // 배경색
  },
  dayDropdown: {
    display: 'flex',
    flexDirection: 'row',
    background: '#f9f9f9',
    position: 'absolute',
    zIndex: 1,
    border: '1px solid #ccc',
  },
};

const DragAndDrop = () => {
  const [rightBoxes, setRightBoxes] = useState([]);
  const [activeDay, setActiveDay] = useState('수'); // 기본 활성화 요일
  const [selectedRaid, setSelectedRaid] = useState('All'); // 선택된 레이드
  const [nickname, setNickname] = useState(''); // 닉네임 상태 추가
  const [dealers, setDealers] = useState([]);
  const [supports, setSupports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null); // 삭제할 캐릭터 정보
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [boxToDelete, setBoxToDelete] = useState(null); // 삭제할 박스 정보

  const days = ['All', '월', '화', '수', '목', '금', '토', '일'];

  const [showDayOptions, setShowDayOptions] = useState({}); // 특정 박스에 대해 요일 선택 표시 여부

  const raidTitleOptions = [
    'All',
    '노기르',
    '하기르',
    '노브',
    '하브',
    '3막 노말',
    '3막 하드',
  ];

  const raidTimeOptions = [
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
    '23:00',
    '23:30',
    '24:00',
  ];

  const getAllCharacter = async () => {
    const { data } = await axios.get(API.getAllCharacters, {
      withCredentials: true, // 쿠키/인증 정보 포함
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const groupedDealers = {
      '1690+': [],
      1680: [],
      1670: [],
      1660: [],
    };

    const groupedSupports = {
      '1690+': [],
      1680: [],
      1670: [],
      1660: [],
    };

    data.forEach((el) => {
      const classImg = IMG[el.className];
      const newItem = {
        id: uuidv4(), // 고유한 아이디 생성
        name: el.nickName,
        level: el.level,
        className: el.className,
        classImg,
      };

      const level = parseFloat(el.level.replace(/,/g, '')); // 쉼표 제거 후 숫자로 변환

      let levelKey = '1690+';
      if (level >= 1660 && level < 1670) levelKey = '1660';
      else if (level >= 1670 && level < 1680) levelKey = '1670';
      else if (level >= 1680 && level < 1690) levelKey = '1680';

      // 딜러/서포터로 분류
      if (['바드', '도화가', '홀리나이트'].includes(el.className)) {
        groupedSupports[levelKey].push(newItem);
      } else {
        groupedDealers[levelKey].push(newItem);
      }
    });

    // 상태 업데이트
    setDealers(groupedDealers);
    setSupports(groupedSupports);
  };

  // 직업 정보 가져오기
  const getCharacterInfo = async () => {
    try {
      const { data } = await axios.get(API.getCharater, {
        params: { characterName: nickname },
      });

      const { className, level, nickName } = data;

      const classImg = IMG[className];
      const parsedLevel = parseFloat(level.replace(/,/g, '')); // 쉼표 제거 후 숫자로 변환

      const newItem = {
        id: uuidv4(),
        name: nickName,
        level: level, // 원본 문자열 유지
        parsedLevel, // 숫자형 레벨 추가
        className,
        classImg,
      };

      // 레벨 구간 확인
      let levelKey = '1690+';
      if (parsedLevel >= 1660 && parsedLevel < 1670) levelKey = '1660';
      else if (parsedLevel >= 1670 && parsedLevel < 1680) levelKey = '1670';
      else if (parsedLevel >= 1680 && parsedLevel < 1690) levelKey = '1680';

      // 중복 검사
      const checkDuplicate = (group) => {
        return group[levelKey]?.some((item) => item.name === nickName);
      };

      // 서포터에 추가
      if (['바드', '도화가', '홀리나이트'].includes(className)) {
        if (!checkDuplicate(supports)) {
          const updatedSupports = { ...supports };
          updatedSupports[levelKey] = [
            ...(updatedSupports[levelKey] || []),
            newItem,
          ];
          setSupports(updatedSupports);
        } else {
          alert('이미 존재하는 캐릭터입니다.');
        }
      } else {
        // 딜러에 추가
        if (!checkDuplicate(dealers)) {
          const updatedDealers = { ...dealers };
          updatedDealers[levelKey] = [
            ...(updatedDealers[levelKey] || []),
            newItem,
          ];
          setDealers(updatedDealers);
        } else {
          alert('이미 존재하는 캐릭터입니다.');
        }
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
    getBoxes(activeDay, selectedRaid);
  }, []);

  useEffect(() => {
    getBoxes(activeDay, selectedRaid);
  }, [rightBoxes]);

  const addBox = async () => {
    await axios
      .post(API.addRaidGroup, null, {
        params: {
          day: activeDay,
        },
      })
      .then(({ data }) => {
        setRightBoxes([
          ...rightBoxes,
          {
            id: data.id,
            day: activeDay,
            title: null,
            time: null,
            dealers: [],
            supports: [],
          },
        ]);
      });
  };

  const getBoxes = async (day, raid) => {
    setActiveDay(day);
    setSelectedRaid(raid);

    try {
      const { data } = await axios.get(API.getRaidGroups, {
        params: {
          day: day,
          raid: raid,
        },
      });

      const newBoxes = data.map((item) => ({
        id: item.raidGroupId,
        title: item.name,
        day: item.day,
        time: item.time,
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
    } catch (error) {
      console.error('오류 발생:', error);
    }
  };

  const handleDragStart = (e, itemId) => {
    e.dataTransfer.setData('itemId', itemId);
  };

  // 드래그 종료 시 호출
  const handleDrop = async (e, boxId) => {
    const itemId = e.dataTransfer.getData('itemId');

    // 그룹화된 딜러 및 서포터 목록에서 아이템 찾기
    const findItemInGroup = (groupedItems) => {
      for (const key in groupedItems) {
        const foundItem = groupedItems[key].find((item) => item.id === itemId);
        if (foundItem) return foundItem;
      }
      return null;
    };

    const item = findItemInGroup(dealers) || findItemInGroup(supports); // 딜러나 서포터 중에서 아이템 찾기

    if (!item) {
      alert('유효하지 않은 아이템입니다.');
      return;
    }

    try {
      // 서버로 캐릭터 추가 요청
      const response = await axios.post(API.addCharacterToRaidGroup, null, {
        params: {
          raidGroupId: boxId,
          characterName: item.name,
        },
      });

      // 서버 응답이 성공적일 경우, UI 업데이트
      if (response.status === 200) {
        const updatedBoxes = [...rightBoxes];
        const boxIndex = updatedBoxes.findIndex((box) => box.id === boxId);

        if (boxIndex !== -1) {
          const targetBox = updatedBoxes[boxIndex];
          if (['바드', '도화가', '홀리나이트'].includes(item.className)) {
            targetBox.supports.push(item);
          } else {
            targetBox.dealers.push(item);
          }
          setRightBoxes(updatedBoxes);
        }
      }
    } catch (error) {
      // 서버에서 중복 등 오류 처리
      if (error.response) {
        alert(error.response.data.message || '중복된 캐릭터입니다.');
      } else {
        console.error('네트워크 오류:', error);
        alert('네트워크 오류가 발생했습니다.');
      }
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
    if (!characterToDelete) return;

    const {
      id: characterId,
      type: characterType,
      nickName: characterNickName,
    } = characterToDelete;

    try {
      await axios.delete(`${API.deleteCharacters}/${characterNickName}`);

      // 상태 업데이트
      if (characterType === 'dealers') {
        setDealers((prevDealers) => {
          const updatedDealers = { ...prevDealers };
          for (const level in updatedDealers) {
            updatedDealers[level] = updatedDealers[level].filter(
              (item) => item.id !== characterId
            );
          }
          return updatedDealers;
        });
      } else if (characterType === 'supports') {
        setSupports((prevSupports) => {
          const updatedSupports = { ...prevSupports };
          for (const level in updatedSupports) {
            updatedSupports[level] = updatedSupports[level].filter(
              (item) => item.id !== characterId
            );
          }
          return updatedSupports;
        });
      }
    } catch (error) {
      console.error('캐릭터 삭제 중 오류 발생:', error);
      alert('캐릭터를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setIsModalOpen(false);
      setCharacterToDelete(null);
    }
  };

  const openDeleteModal = (id, type, nickName) => {
    setCharacterToDelete({ id, type, nickName }); // 삭제 대상 설정
    setIsModalOpen(true); // 모달 열기
  };

  const handleTitleChange = (boxId, newTitle) => {
    setRightBoxes((prevBoxes) =>
      prevBoxes.map((box) =>
        box.id === boxId ? { ...box, title: newTitle } : box
      )
    );

    axios.post(`${API.updateTitle}/${boxId}`, null, {
      params: { raidName: newTitle },
    });
  };

  const handleTimeChange = (boxId, newTime) => {
    setRightBoxes((prevBoxes) =>
      prevBoxes.map((box) =>
        box.id === boxId ? { ...box, time: newTime } : box
      )
    );

    axios.post(`${API.updateTime}/${boxId}`, null, {
      params: { raidTime: newTime },
    });
  };

  const handleDayChange = async (boxId, newDay) => {
    setRightBoxes((prevBoxes) =>
      prevBoxes.map((box) =>
        box.id === boxId ? { ...box, days: newDay } : box
      )
    );

    // 서버에 요청 보내기
    try {
      await axios.post(`${API.updateDay}/${boxId}`, null, {
        params: { raidDay: newDay },
      });
    } catch (error) {
      console.error('요일 변경 중 오류 발생:', error);
      alert('요일 변경 중 문제가 발생했습니다.');
    }
  };

  const toggleDayOptions = (boxId) => {
    setShowDayOptions((prev) => ({
      ...prev,
      [boxId]: !prev[boxId],
    }));
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
          {Object.entries(dealers)
            .sort((a, b) => {
              const levels = ['1660', '1670', '1680', '1690+'];
              return levels.indexOf(b[0]) - levels.indexOf(a[0]); // 역순 정렬
            })
            .map(([range, items]) => (
              <div key={range}>
                <h4 style={{ color: 'white', marginBottom: '10px' }}>
                  {range}
                </h4>
                <div style={styles.itemContainer}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={styles.characterItem}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                    >
                      <button
                        onClick={() =>
                          openDeleteModal(item.id, 'dealers', item.name)
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
            ))}
        </div>

        {/* 서포트 섹션 */}
        <div style={styles.supportSection}>
          <div style={styles.sectionTitle}>서포터</div>
          {Object.entries(supports)
            .sort((a, b) => {
              const levels = ['1660', '1670', '1680', '1690+'];
              return levels.indexOf(b[0]) - levels.indexOf(a[0]); // 역순 정렬
            })
            .map(([range, items]) => (
              <div key={range}>
                <h4 style={{ color: 'white', marginBottom: '10px' }}>
                  {range}
                </h4>
                <div style={styles.itemContainer}>
                  {items.map((item) => (
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
            ))}
        </div>
      </div>
      {/* ========================================================================================== */}

      {/* 가운데 영역 */}
      <div style={styles.gridContainer}>
        <div style={styles.daysAndRaidsContainer}>
          {/* 요일 버튼 */}
          <div style={styles.daysContainer}>
            <div style={{ flex: 0.1 }}></div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => getBoxes(day, selectedRaid)}
                  style={{
                    ...styles.dayButton,
                    ...(activeDay === day ? styles.activeDayButton : {}),
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

          {/* 레이드 버튼 */}
          <div style={styles.raidsContainer}>
            {raidTitleOptions.map((raid) => (
              <button
                key={raid}
                onClick={() => getBoxes(activeDay, raid)}
                style={{
                  ...styles.raidButton,
                  ...(selectedRaid === raid ? styles.activeRaidButton : {}),
                }}
              >
                {raid}
              </button>
            ))}
          </div>
        </div>

        {rightBoxes
          .filter(
            (box) =>
              (activeDay === 'All' || box.day === activeDay) &&
              (selectedRaid === 'All' || box.title === selectedRaid)
          )
          .map((box) => (
            <div key={box.id} style={styles.rightBox}>
              {/* 제목과 시간 드롭다운 */}
              <div style={styles.sectionTitle}>
                {/* 요일 표시 */}
                {/* <div style={styles.dayDisplay}>{box.day}</div> */}

                {/* 요일 표시 버튼 */}
                <div>
                  <button
                    onClick={() => toggleDayOptions(box.id)}
                    style={styles.dayButton}
                  >
                    {box.day || '요일 선택'}
                  </button>
                  {showDayOptions[box.id] && (
                    <div style={styles.dayDropdown}>
                      {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                        <button
                          key={day}
                          onClick={() => {
                            handleDayChange(box.id, day); // 요일 변경 핸들러 호출
                            toggleDayOptions(box.id); // 드롭다운 닫기
                          }}
                          style={styles.dayOption}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={box.title || '레이드 선택'}
                  onChange={(e) => handleTitleChange(box.id, e.target.value)}
                  style={styles.selectDropdown}
                >
                  <option disabled>레이드 선택</option>
                  {raidTitleOptions.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>

                <select
                  value={box.time || '시간 선택'}
                  onChange={(e) => handleTimeChange(box.id, e.target.value)}
                  style={styles.selectDropdown}
                >
                  <option disabled>시간 선택</option>
                  {raidTimeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>

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
                      <div style={styles.characterText}>
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
                      <div style={styles.characterText}>
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
    </div>
  );
};

export default DragAndDrop;
