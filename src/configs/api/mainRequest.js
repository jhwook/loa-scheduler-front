import axios from "axios";
import { mainUrl } from "./apiUrl";
import { refreshCheck, refreshCheckErrorHandle } from "./refresh/refreshCheck";

const mainRequest = axios.create({
  baseURL: mainUrl,
  timeout: 10000,
  params: {},
});

// 토큰 리프레시
// mainRequest.interceptors.request.use(refreshCheck, refreshCheckErrorHandle);

// mainRequest.interceptors.response.use((response) => response);

export default mainRequest;