import { Input, Button, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

export function SignIn() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8282/auth/signin", {
        username,
        password,
      });

      const token = response.data.token;
      localStorage.setItem("token", token);

      alert("로그인 성공!");
      navigate("/");
    } catch (err) {
      alert("로그인 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">
            Sign In
          </Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            Enter your ID and password to Sign In.
          </Typography>
        </div>

        <form onSubmit={handleLogin} className="mt-8 mb-2 mx-auto">
          <div className="mb-6 flex flex-col gap-6">
            <div>
              <Typography variant="small" color="blue-gray" className="mb-1 font-medium">
                아이디
              </Typography>
              <Input
                size="lg"
                placeholder="ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              />
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="mb-1 font-medium">
                비밀번호
              </Typography>
              <Input
                type="password"
                size="lg"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              />
            </div>
          </div>

          <Button type="submit" className="mt-6" fullWidth disabled={!username || !password}>
            Sign In
          </Button>

          <div className="space-y-4 mt-8">
            <Button
              size="lg"
              color="gray"
              className="flex items-center gap-2 justify-center shadow-md"
              fullWidth
            >
              <svg
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* (SVG 내용은 그대로 유지) */}
              </svg>
              <span>Sign in With Google</span>
            </Button>
          </div>

          <Typography
            variant="paragraph"
            className="text-center text-blue-gray-500 font-medium mt-4"
          >
            Not registered?
            <Link to="/auth/sign-up" className="text-gray-900 ml-1">
              Create account
            </Link>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignIn;
