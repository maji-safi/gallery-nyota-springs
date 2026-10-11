export type GalleryVideo = { id:string; title:string; category:string; poster:string; src:string };
// Add up to ten (or more) videos when ready. Prefer compressed MP4 or streaming URLs.
// Videos are click-to-play with preload="none"; nothing is downloaded automatically.
// Example:
// { id:'film-01', title:'A morning at Nyota Springs', category:'breakfast',
//   poster:'https://nyotasprings.com/wp-content/uploads/.../poster.jpg',
//   src:'https://nyotasprings.com/wp-content/uploads/.../reel.mp4' },
export const videos: GalleryVideo[] = [];
