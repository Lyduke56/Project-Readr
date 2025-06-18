'use client';
import React, { useState } from "react";

interface InputFieldProps {
  className?: string;
  label: string;
  state?: "default" | "hover" | "focus" | "error";
  value?: string;
  valueType?: "value" | "placeholder";
  onChange?: (value: string) => void;
}

export const InputField = ({
  className,
  label,
  state = "default",
  value = "",
  valueType = "placeholder",
  onChange,
}: InputFieldProps) => {
  const [inputValue, setInputValue] = useState(valueType === "value" ? value : "");
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-[16px] text-[#1E1E1E] font-inter mb-[8px]">
        {label}
      </label>
      <input
        type={label.toLowerCase() === "password" ? "password" : "text"}
        placeholder={valueType === "placeholder" ? value : ""}
        value={valueType === "value" ? inputValue : undefined}
        onChange={handleChange}
        className={`w-[272px] h-[40px] px-4 py-3 border rounded-lg font-inter text-[16px] text-black ${
          state === "error"
            ? "border-red-500"
            : "border-[#D9D9D9] placeholder-[#B3B3B3]"
        }`}
      />
    </div>
  );
};
