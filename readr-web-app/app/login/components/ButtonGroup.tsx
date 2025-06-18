import React from "react";

interface ButtonGroupProps {
  className?: string;
  buttonLabel: string;
  align?: "left" | "center" | "right" | "justify";
  buttonStart?: boolean;
  buttonEnd?: boolean;
}

export const ButtonGroup = ({
  className,
  buttonLabel,
  align = "center",
  buttonStart = false,
  buttonEnd = false,
}: ButtonGroupProps) => {
  return (
    <div className={`flex ${className}`}>
      <button
        className={`w-full h-[40px] bg-[#2C2C2C] text-white rounded-lg font-inter text-[16px] flex items-center justify-center 
        transition-all duration-300 hover:scale-105 hover:bg-[#3a3a3a] ${
          align === "left" ? "justify-start" :
          align === "right" ? "justify-end" :
          align === "justify" ? "justify-between" : "justify-center"
        }`}
      >
        {buttonStart && <span className="mr-2">→</span>}
        {buttonLabel}
        {buttonEnd && <span className="ml-2">→</span>}
      </button>
    </div>
  );
};
