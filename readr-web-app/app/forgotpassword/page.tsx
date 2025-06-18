'use client';
import React, { useState } from "react";
import Image from "next/image";
import { ButtonGroup } from "@/app/login/components/ButtonGroup";
import { InputField } from "@/app/login/components/InputField";
import { TextLink } from "@/app/login/components/TextLink";

export const LoginPage = (): React.ReactNode => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [randomGreeting, setRandomGreeting] = useState("");
  
  const greetings = [
    "We Missed You",
    "Welcome Back",
    "Good to See You Again",
    "Hello Again"
  ];
  
  React.useEffect(() => {
    setRandomGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  return (
    <div className="bg-[#f4f7f2] flex flex-row justify-center w-full h-[100vh]">

      {/* Header */}
        <div className="absolute w-full h-[100px] top-0 left-0 bg-[#26342d] flex flex-row items-center justify-between px-10">
          <div className="top-[19px] [font-family:'Merriweather-Bold',Helvetica] font-bold text-[#d4b866] text-5xl text-center tracking-[0.58px] leading-[normal]">
            Readr
          </div>
          <div className="flex flex-row gap-8">
            <div className="w-[113px] [font-family:'Inter-Regular',Helvetica] font-normal text-white text-2xl text-center tracking-[0.58px] leading-[normal] transition-colors duration-300 hover:text-[#d4b866] cursor-pointer">
              Home
            </div>
            <div className="w-[113px] [font-family:'Inter-Regular',Helvetica] font-normal text-white text-2xl text-center tracking-[0.58px] leading-[normal] transition-colors duration-300 hover:text-[#d4b866] cursor-pointer">
              Features
            </div>
            <div className="w-[113px] [font-family:'Inter-Regular',Helvetica] font-normal text-white text-2xl text-center tracking-[0.58px] leading-[normal] transition-colors duration-300 hover:text-[#d4b866] cursor-pointer">
              About
            </div>
          </div>
        </div>
        
      <div className="bg-[#f4f7f2] overflow-hidden w-[1440px] h-[calc(100vh-100px)] relative top-[100px]">
        {/* Login Form Card */}
        <div className="absolute w-[385px] h-[750px] top-[50px] left-[41px] bg-white shadow-[0px_4px_4px_3px_#00000040]">
          <div className="absolute w-[336px] h-[169px] top-[187px] left-[25px]">
            <p className="absolute w-[336px] top-0 left-0 [font-family:'Merriweather-Regular',Helvetica] font-normal text-[#2d2d2d] text-[40px] text-center tracking-[0.58px] leading-[normal]">
              <span className="tracking-[0.23px]">
                {randomGreeting}
                <br />
              </span>
              <span className="text-[15px] tracking-[0.09px]">
 
              </span>
            </p>

            <InputField
              className="!flex !absolute !left-8 !w-[272px] !top-[99px]"
              label="Email"
              state="default"
              value="Enter your email"
              valueType="placeholder"
              onChange={setEmail}
            />
          </div>

          <InputField
            className="!flex !absolute !left-[57px] !w-[272px] !top-[380px]"
            label="Password"
            state="default"
            value="Enter your password"
            valueType="placeholder"
            onChange={setPassword}
          />
          <InputField
            className="!flex !absolute !left-[57px] !w-[272px] !top-[480px]"
            label="Confirm Password"
            state="default"
            value="Confirm your password"
            valueType="placeholder"
            onChange={setConfirmPassword}
          />
        
          <ButtonGroup
            align="justify"
            buttonLabel="Register"
            buttonStart={false}
            className="!absolute !left-[57px] !w-[272px] !top-[570px]"
          />

        </div>

        {/* Right Panel */}
        <div className="absolute w-[1011px] h-[759px] top-[45px] left-[453px]">
          <div className="absolute w-[987px] h-[750px] top-[7px] left-0 bg-[#d9d9d9] border border-solid border-black shadow-[0px_4px_4px_2px_#00000040]" />
          
          <Image
            className="absolute w-[987px] h-[750px] object-cover top-[7px] left-0"
            alt="Library"
            src="/LibraryPic.png"
            width={987}
            height={886}
          />  

          <p className="absolute w-[667px] top-1.5 left-[344px] [font-family:'Inter-Bold',Helvetica] font-bold text-white text-2xl tracking-[0.58px] leading-[normal]">
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
