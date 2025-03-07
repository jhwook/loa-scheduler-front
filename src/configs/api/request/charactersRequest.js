import mainRequest from "../mainRequest";

const mainUrl = '/all/characters';

export const getAllCharacters = async (params) => {
  try {
    const response = await mainRequest.get(mainUrl, params);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}