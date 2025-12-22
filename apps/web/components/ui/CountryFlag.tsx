/* eslint-disable @next/next/no-img-element */
interface CountryFlagProps {
  code: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-6 h-4",
  md: "w-8 h-6",
  lg: "w-12 h-8",
};

export function CountryFlag({ code, size = "md" }: CountryFlagProps) {
  // Use flag CDN (flagcdn.com) - external SVGs work better with img tag
  return (
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt={`${code} flag`}
      className={`${sizes[size]} object-cover border border-black`}
    />
  );
}
