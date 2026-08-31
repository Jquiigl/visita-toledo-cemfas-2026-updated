import PublicGuide from '../public-guide';
import {normalizeLanguage} from '../../data/language';

export default async function Page({searchParams}:{searchParams:Promise<{lang?:string|string[]}>}){
  const params=await searchParams;
  return <PublicGuide initialLanguage={normalizeLanguage(params.lang)}/>;
}
