import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * Sekme/ekran odaklandığında verilen async yükleyiciyi tekrar çalıştırır.
 * Ekranlar arasında SQLite verisinin güncel kalmasını sağlar.
 */
export function useRefreshOnFocus<T>(loader: () => Promise<T>, initial: T): { data: T; reload: () => Promise<void>; loading: boolean } {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const next = await loader();
      setData(next);
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loader()
        .then((next) => {
          if (active) setData(next);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [loader]),
  );

  return { data, reload, loading };
}
