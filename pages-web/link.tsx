import type {AnchorHTMLAttributes} from 'react';
// Full navigation deliberately re-runs the server's /admin authorization guard.
export default function Link(props:AnchorHTMLAttributes<HTMLAnchorElement>){return <a {...props}/>;}
