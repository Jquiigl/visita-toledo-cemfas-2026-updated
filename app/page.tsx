import Cover from './cover';
import {normalizeLanguage} from '../data/language';

// Resolve the selected language on the server too, keeping the first render and hydration consistent.
export default async function Page({searchParams}:{searchParams:Promise<{lang?:string|string[]}>}){
  const params=await searchParams;
  return <Cover initialLanguage={normalizeLanguage(params.lang)}/>;
}
