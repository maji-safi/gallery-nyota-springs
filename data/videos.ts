
export type GalleryVideo = {
  id: string;
  title: string;
  src: string;
};

const mediaBase =
  "https://nyotasprings.com/wp-content/uploads/2026/10";

export const videos: GalleryVideo[] = [
  {
    id: "bridge",
    title: "The Bridge",
    src: `${mediaBase}/Bridge-Fixed.mp4`,
  },
  {
    id: "bush-breakfast",
    title: "Bush Breakfast",
    src: `${mediaBase}/Bush-Breakfast-Fixed.mp4`,
  },
  {
    id: "double-room",
    title: "Double Room",
    src: `${mediaBase}/Double-Room-Fixed.mp4`,
  },
  {
    id: "executive-tent",
    title: "Executive Tent",
    src: `${mediaBase}/Executive-tent-Fixed.mp4`,
  },
  {
    id: "family-tent-1",
    title: "Family Tent 1",
    src: `${mediaBase}/Family-Tent-1-Fixed.mp4`,
  },
  {
    id: "family-tent-2",
    title: "Family Tent 2",
    src: `${mediaBase}/Family-Tent-2-Fixed.mp4`,
  },
  {
    id: "main-area",
    title: "Main Area",
    src: `${mediaBase}/Main-Area-Fixed.mp4`,
  },
  {
    id: "outside-tent",
    title: "Outside Tent",
    src: `${mediaBase}/Outside-Tent-Fixed.mp4`,
  },
  {
    id: "safari-walk",
    title: "Safari Walk",
    src: `${mediaBase}/Safari-Walk-Fixed.mp4`,
  },
  {
    id: "triple-room",
    title: "Triple Room",
    src: `${mediaBase}/Tripple-Room-Fixed.mp4`,
  },
  {
    id: "twin-room",
    title: "Twin Room",
    src: `${mediaBase}/Twin-Room-Fixed.mp4`,
  },
];
