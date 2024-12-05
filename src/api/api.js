const url = 'http://localhost:8282';

export const API = {
  getCharater: url + '/character',
  getAllCharacters: url + '/all/characters',
  deleteCharacters: url + '/characters',
  addRaidGroup: url + '/raid/group',
  getRaidGroups: url + '/raid/group',
  deleteRaid: url + '/raid',
  deleteCharactersFromRaid: url + '/raid/character',
  addCharacterToRaidGroup: url + '/raid/character',
};
