export type Category = {
  id: string;
  title: string;
  intro: string;
  min: number;
  max: number;
  start: string;
  end: string;
};
const root = "https://nyotasprings.com/wp-content/uploads/";
export const categories: Category[] = [
  {
    id: "breakfast",
    title: "Breakfast Section",
    intro: "Slow mornings, open skies and the first light of the wild.",
    min: 2543,
    max: 2593,
    start: root + "nyota-gallery/set-8/IMG_2543.jpg",
    end: root + "nyota-gallery/set-8/IMG_2593.jpg",
  },
  {
    id: "double-room",
    title: "Double Room 1",
    intro: "Unhurried comfort, considered down to the smallest detail.",
    min: 2934,
    max: 3329,
    start: root + "2026/09/IMG_2934.jpg",
    end: root + "2026/09/IMG_3329.jpg",
  },
  {
    id: "executive-room",
    title: "Executive Room",
    intro: "Space to settle in and stay a little longer.",
    min: 4131,
    max: 4361,
    start: root + "nyota-gallery/set-7/IMG_4131.jpg",
    end: root + "nyota-gallery/set-7/IMG_4361.jpg",
  },
  {
    id: "family-tent-one",
    title: "Familiy Tent 1",
    intro: "Together, with the wilderness just beyond the door.",
    min: 2594,
    max: 3124,
    start: root + "2026/09/IMG_2594-HDR.jpg",
    end: root + "2026/09/IMG_3124.jpg",
  },
  {
    id: "family-tent-two",
    title: "Familiy Tent 2",
    intro: "Room to reconnect and make memories.",
    min: 3521,
    max: 3752,
    start: root + "2026/09/IMG_3521.jpg",
    end: root + "2026/09/IMG_3752.jpg",
  },
  {
    id: "main-area",
    title: "Main Area",
    intro: "The heart of camp, where every journey comes together.",
    min: 4362,
    max: 4509,
    start: root + "2026/09/IMG_4362-scaled.jpg",
    end: root + "2026/09/IMG_4509.jpg",
  },
  {
    id: "outside-lunch",
    title: "Outside and lunch",
    intro: "A table with a view, and time on your side.",
    min: 3127,
    max: 3247,
    start: root + "nyota-gallery/set-9/IMG_3127.jpg",
    end: root + "nyota-gallery/set-9/IMG_3247.jpg",
  },
  {
    id: "triple-room",
    title: "Triple Room",
    intro: "Travel together, sleep beautifully.",
    min: 4020,
    max: 4130,
    start: root + "nyota-gallery/set-6/IMG_4020.jpg",
    end: root + "nyota-gallery/set-6/IMG_4130-scaled.jpg",
  },
  {
    id: "twin-room",
    title: "Twin Room",
    intro: "Every detail made for a restful stay.",
    min: 3335,
    max: 3515,
    start: root + "2026/09/IMG_3335.jpg",
    end: root + "nyota-gallery/set-5/IMG_3515.jpg",
  },
  {
    id: "bush-breakfast",
    title: "walk and bush breakfast",
    intro: "Follow the path. Discover a breakfast worth waking up for.",
    min: 3789,
    max: 3972,
    start: root + "nyota-gallery/set-10/IMG_3789.jpg",
    end: root + "nyota-gallery/set-10/IMG_3972.jpg",
  },
];
export const EXTRA_FEATURED_IMAGE = root + "2026/09/IMG_3370-potrait.png";
