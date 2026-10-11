import Gallery from "@/components/Gallery";
import { getPhotos } from "@/lib/photos";
export const revalidate = 3600;
export default async function Home() {
  const photos = await getPhotos();
  return <Gallery photos={photos} />;
}
