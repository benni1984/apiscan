'use client';

import { useEffect } from 'react';

export default function AosInit() {
  useEffect(() => {
    import('aos').then(mod => {
      mod.default.init({ duration: 650, once: true, offset: 60 });
    });
  }, []);
  return null;
}
