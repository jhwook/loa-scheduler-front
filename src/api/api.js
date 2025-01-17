// const url = 'http://localhost:8282';
// const url = 'https://ec2-15-164-217-6.ap-northeast-2.compute.amazonaws.com';
const url = 'https://loa-scheduler.com';

export const API = {
  getCharater: url + '/character',
  getAllCharacters: url + '/all/characters',
  deleteCharacters: url + '/characters',
  addRaidGroup: url + '/raid/group',
  getRaidGroups: url + '/raid/group',
  deleteRaid: url + '/raid',
  deleteCharactersFromRaid: url + '/raid/character',
  addCharacterToRaidGroup: url + '/raid/character',
  updateTitle: url + '/raid/name',
  updateTime: url + '/raid/time',
  updateDay: url + '/raid/day',
};
