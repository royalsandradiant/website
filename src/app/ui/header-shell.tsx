import { fetchCategoryTree } from '@/app/lib/data';
import Header from './header';

export default async function HeaderShell() {
  const categories = await fetchCategoryTree();
  return <Header categories={categories} />;
}
