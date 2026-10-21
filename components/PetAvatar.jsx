'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PetAvatar({ path, size = 64, species = 'dog' }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let on = true;
    setUrl(null);
    if (path) {
      supabase.storage.from('pet-photos').createSignedUrl(path, 3600).then(({ data }) => {
        if (on) setUrl(data?.signedUrl || null);
      });
    }
    return () => { on = false; };
  }, [path]);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Foto de la mascota" width={size} height={size} style={{ width: size, height: size }} className="rounded-full object-cover" />
  ) : (
    <div style={{ width: size, height: size, fontSize: size / 2 }} className="flex items-center justify-center rounded-full bg-brand-100">{species === 'cat' ? '🐱' : species === 'other' ? '🐾' : '🐶'}</div>
  );
}
