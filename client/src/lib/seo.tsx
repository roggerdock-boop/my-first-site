import { useEffect } from 'react';

export function useSeo({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title;
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = description;
  }, [title, description]);
}
