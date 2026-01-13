import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "@/config/base-url";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/autoplay';
import logoLogin from "@/assets/receipt/fts_log.png";

const sliderImages = [
  {
    id: 1,
    title: "Empowering Tribal Communities",
    description: "Providing five-fold education and holistic development for tribal upliftment since 1989",
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
 

  {
    id: 2,
    title: "Education for All",
    description: "Spreading literacy and values education to create empowered communities",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  }
];

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [username, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const navigate = useNavigate();

  const loadingMessages = [
    "Setting things up for you...",
    "Preparing your Password...",
    "Almost there...",
  ];

  useEffect(() => {
    let messageIndex = 0;
    let intervalId;

    if (isLoading) {
      setLoadingMessage(loadingMessages[0]);
      intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 800);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate inputs
    if (!email.trim() || !username.trim()) {
      toast.error('Please enter both username and email.');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("name", username);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/panel-send-password?username=${username}&email=${email}`,
        formData
      );
      if (res?.data?.code === 201) {
        toast.success(res?.data?.message || "Password reset link sent successfully!");
        navigate('/')
      } else {
        toast.error(res?.data?.message || "Unexpected Error");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !isLoading) {
      handleSubmit(event);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob login-blob-1"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 login-blob-2"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 login-blob-3"></div>
      </div>

      <motion.div
        className="flex flex-row shadow-2xl rounded-2xl overflow-hidden max-w-md w-full relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Right Side - Slider */}
        {/* <div className="hidden md:flex flex-col items-center justify-center p-1 w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full h-full rounded-xl overflow-hidden shadow-lg">
            <Swiper
              modules={[Autoplay, EffectFade]}
              effect="fade"
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              loop={true}
              className="w-full h-full"
            >
              {sliderImages.map((slide) => (
                <SwiperSlide key={slide.id}>
                  <div className="relative w-full h-full">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {slide.title}
                      </h3>
                      <p className="text-white/90">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div> */}
        {/* Left Side - Forgot Password Form */}
        <div className="w-full  px-4 py-8 md:py-0 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full"
          >
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="pb-4 md:pb-6 flex flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="flex-shrink-0">
                  <img 
                    src={logoLogin} 
                    className="w-auto h-16 md:h-20" 
                    alt="FTS Champ Logo"
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-[var(--team-color)] to-[var(--color-dark)] bg-clip-text text-transparent">
                    Reset Your Password
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm md:text-base">
                    Enter your username and email to receive reset instructions
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-2 ">
                <form onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                        Username
                      </Label>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUserName(e.target.value)}
                          required
                          minLength={1}
                          maxLength={50}
                          className="h-10 md:h-11 border-gray-300 focus:border-[var(--color-border)] focus:ring-[var(--color-border)] transition-colors"
                          autoComplete="username"
                        />
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </Label>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your registered email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          minLength={1}
                          maxLength={50}
                          className="h-10 md:h-11 border-gray-300 focus:border-[var(--color-border)] focus:ring-[var(--color-border)] transition-colors"
                          autoComplete="email"
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button
                        type="submit"
                        className="w-full h-10 md:h-11 bg-gradient-to-r from-[var(--team-color)] to-[var(--color-dark)] hover:opacity-90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm md:text-base"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <motion.span
                            key={loadingMessage}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-sm"
                          >
                            {loadingMessage}
                          </motion.span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Reset Password
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </form>

            
              </CardContent>
                  <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 mb-4 text-center"
                >
                  <button
                    onClick={() => navigate("/")}
                    className="text-xs md:text-sm text-[var(--color)] hover:text-[var(--color-dark)] font-medium transition-colors duration-200 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </motion.div>
            </Card>
          </motion.div>
        </div>

      
      </motion.div>

      {/* Add CSS for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}