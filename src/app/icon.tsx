import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5e5d4, #cba46a 45%, #8d6546)",
          borderRadius: 18,
          color: "#22150f",
          fontSize: 34,
          fontWeight: 700,
        }}
      >
        LG
      </div>
    ),
    size
  );
}
