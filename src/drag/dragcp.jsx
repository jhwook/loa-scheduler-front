// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { API } from '../api/api';
// import { v4 as uuidv4 } from 'uuid';
// import 브레이커 from '../img/브레이커.png';
// import 건슬링어 from '../img/건슬링어.png';
// import 기공사 from '../img/기공사.png';
// import 기상술사 from '../img/기상술사.png';
// import 데모닉 from '../img/데모닉.png';
// import 데빌헌터 from '../img/데빌헌터.png';
// import 도화가 from '../img/도화가.png';
// import 디트로이드 from '../img/디트로이드.png';
// import 리퍼 from '../img/리퍼.png';
// import 바드 from '../img/바드.png';
// import 배틀마스터 from '../img/배틀마스터.png';
// import 버서커 from '../img/버서커.png';
// import 블레이드 from '../img/블레이드.png';
// import 블래스터 from '../img/블래스터.png';
// import 서머너 from '../img/서머너.png';
// import 소서리스 from '../img/소서리스.png';
// import 소울이터 from '../img/소울이터.png';
// import 스카우터 from '../img/스카우터.png';
// import 스트라이커 from '../img/스트라이커.png';
// import 슬레이어 from '../img/슬레이어.png';
// import 아르카나 from '../img/아르카나.png';
// import 워로드 from '../img/워로드.png';
// import 인파이터 from '../img/인파이터.png';
// import 창술사 from '../img/창술사.png';
// import 호크아이 from '../img/호크아이.png';
// import 홀리나이트 from '../img/홀리나이트.png';

// const IMG = {
//   브레이커: 브레이커,
//   건슬링어: 건슬링어,
//   기공사: 기공사,
//   기상술사: 기상술사,
//   데모닉: 데모닉,
//   데빌헌터: 데빌헌터,
//   도화가: 도화가,
//   디트로이드: 디트로이드,
//   리퍼: 리퍼,
//   바드: 바드,
//   배틀마스터: 배틀마스터,
//   버서커: 버서커,
//   블레이드: 블레이드,
//   블래스터: 블래스터,
//   서머너: 서머너,
//   소서리스: 소서리스,
//   소울이터: 소울이터,
//   스카우터: 스카우터,
//   스트라이커: 스트라이커,
//   슬레이어: 슬레이어,
//   아르카나: 아르카나,
//   워로드: 워로드,
//   인파이터: 인파이터,
//   호크아이: 호크아이,
//   창술사: 창술사,
//   홀리나이트: 홀리나이트,
// };

// const styles = {
//   container: {
//     display: 'flex',
//     gap: '20px',
//     padding: '20px',
//     backgroundColor: '#444',
//     height: '100vh',
//     color: 'white',
//   },
//   leftPanel: {
//     width: '20%',
//     backgroundColor: '#3b4252',
//     padding: '10px',
//     borderRadius: '5px',
//   },
//   gridContainer: {
//     display: 'grid',
//     gridTemplateColumns: '1fr 1fr', // 두 개의 열로 나누기
//     gap: '30px', // 박스 간 간격을 넓히기 위해 30px로 설정
//     flex: 1,
//     width: '60%',
//     overflowY: 'auto',
//     height: '100%',
//   },
//   rightPanel: {
//     width: '100%', // 오른쪽 패널을 100%로 설정하여 박스를 넓게 사용
//     display: 'flex',
//     flexDirection: 'column',
//     justifyContent: 'flex-start',
//     alignItems: 'center',
//     backgroundColor: '#81a1c1',
//     padding: '10px',
//     borderRadius: '5px',
//     marginBottom: '20px', // 각 박스에 하단 여백을 추가하여 구분이 잘 되게 함
//   },
//   itemContainer: {
//     display: 'grid',
//     gridTemplateColumns: '1fr 1fr', // 두 개의 열로 나누기
//     gap: '20px', // 아이템 간 간격을 더 넓게 설정
//     flex: 1,
//     maxHeight: '300px', // 아이템 컨테이너의 최대 높이를 설정
//     overflowY: 'auto', // 높이를 초과할 경우 스크롤 추가
//   },
//   item: {
//     backgroundColor: '#88c0d0',
//     textAlign: 'center',
//     borderRadius: '4px',
//     padding: '5px',
//     margin: '5px 0',
//     height: '60px', // 박스의 높이를 고정값으로 설정
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     overflow: 'hidden', // 내용이 넘칠 경우 잘리도록 설정
//   },
//   rightBox: {
//     display: 'flex',
//     flexDirection: 'column',
//     backgroundColor: '#81a1c1',
//     borderRadius: '4px',
//     padding: '10px',
//     height: '400px',
//     position: 'relative',
//   },
// };

// const DragAndDrop = () => {
//   const [leftItems, setLeftItems] = useState([]);
//   const [rightBoxes, setRightBoxes] = useState([
//     { id: 'box-1', title: 'Box 1', day: 'Mon', items: [] },
//     { id: 'box-2', title: 'Box 2', day: 'Tue', items: [] },
//   ]);

//   const getAllCharacter = async () => {
//     const { data } = await axios.get(API.getAllCharacters);
//     console.log(data);

//     data.forEach((el) => {
//       const classImg = IMG[el.className];
//       const newItem = {
//         id: uuidv4(),
//         name: `${el.nickName} ${el.level}`,
//         classImg,
//       };

//       setLeftItems((prevItems) => [...prevItems, newItem]);
//     });
//   };

//   useEffect(() => {
//     getAllCharacter();
//   }, []);

//   // 드래그 시작 시 호출
//   const handleDragStart = (e, itemId) => {
//     e.dataTransfer.setData('itemId', itemId);
//   };

//   // 드래그 종료 시 호출
//   const handleDrop = (e, boxId) => {
//     const itemId = e.dataTransfer.getData('itemId');
//     const item = leftItems.find((item) => item.id === itemId);
//     const boxIndex = rightBoxes.findIndex((box) => box.id === boxId);

//     if (boxIndex !== -1) {
//       const updatedBoxes = [...rightBoxes];
//       updatedBoxes[boxIndex].items.push(item);
//       setRightBoxes(updatedBoxes);

//       // leftItems에서 제거
//       setLeftItems((prevItems) =>
//         prevItems.filter((item) => item.id !== itemId)
//       );
//     }
//   };

//   return (
//     <div style={styles.container}>
//       {/* 왼쪽 패널 */}
//       <div style={styles.leftPanel}>
//         <h3>Available Characters</h3>
//         <div
//           style={styles.itemContainer}
//           onDragOver={(e) => e.preventDefault()}
//         >
//           {leftItems.map((item) => (
//             <div
//               key={item.id}
//               style={styles.item}
//               draggable
//               onDragStart={(e) => handleDragStart(e, item.id)}
//             >
//               <img
//                 src={item.classImg}
//                 alt={item.name}
//                 style={{ width: '30px', height: '30px', marginRight: '10px' }}
//               />
//               {item.name}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* 오른쪽 박스들 */}
//       <div style={styles.gridContainer}>
//         {rightBoxes.map((box) => (
//           <div
//             key={box.id}
//             style={{ ...styles.rightPanel, backgroundColor: '#81a1c1' }}
//             onDrop={(e) => handleDrop(e, box.id)}
//             onDragOver={(e) => e.preventDefault()}
//           >
//             <h4>{box.title}</h4>
//             <div style={styles.rightBox}>
//               {box.items.map((item) => (
//                 <div
//                   key={item.id}
//                   style={styles.item}
//                   draggable
//                   onDragStart={(e) => handleDragStart(e, item.id)}
//                 >
//                   <img
//                     src={item.classImg}
//                     alt={item.name}
//                     style={{
//                       width: '30px',
//                       height: '30px',
//                       marginRight: '10px',
//                     }}
//                   />
//                   {item.name}
//                 </div>
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default DragAndDrop;
