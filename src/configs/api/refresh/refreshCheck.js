import axios from "axios";
import moment from "moment";
import { mainUrl } from "../apiUrl";

const refreshCheck = async (config) => {
    const refresh_token = localStorage.getItem('refresh_token');
    const expire_at = localStorage.getItem('expires_at');
    let access_token = localStorage.getItem('access_token');

    if (moment(expire_at).diff(moment()) < 0 && refresh_token) {
      // 토큰 갱신 서버통신
      axios.defaults.headers['Authorization'] = `Bearer ${refresh_token}`;
      try {
          const get = await axios.get(`${mainUrl}/auth/refresh`);
          if (get.status === 200) {
              access_token = get.data.access_token;
              localStorage.setItem('access_token', get.data.access_token);
              localStorage.setItem('expires_at', moment().add(1, 'hour').format('yyyy-MM-DD HH:mm:ss'));
          }
      } catch (e) {
          if (e.response) {
              if (e.response.status === 401 && window.location.pathname !== '/login') {
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('expires_at');
                  localStorage.removeItem('user_id');
                  localStorage.removeItem('user');
                  window.location = '/login';
              }
          }
      }
  }

  config.headers['Authorization'] = `Bearer ${access_token}`;

  return config;
}

const refreshCheckErrorHandle = (err) => {
  localStorage.setItem('refresh_token', '');
};

export { refreshCheck, refreshCheckErrorHandle };
