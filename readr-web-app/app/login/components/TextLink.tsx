import React from "react";

interface TextLinkProps {
  className?: string;
  text: string;
}

export const TextLink = ({
  className,
  text,
}: TextLinkProps) => {
  return (
    <a href="#" className={`${className} text-[16px] text-[#1E1E1E] underline font-inter transition-colors duration-300 hover:text-[#d4b866]`}>
      {text}
    </a>
  );
};
