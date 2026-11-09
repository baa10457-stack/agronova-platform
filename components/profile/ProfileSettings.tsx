'use client';

import { useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';

export function ProfileSettings() {
  const { user, avatarUrl } = useAuth();
  const supabase = createSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Utilisateur';

  const initials = String(displayName)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0].toUpperCase())
    .join('');

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file || !user) return;

    setMessage('');
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Choisis un fichier image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 5 Mo.');
      return;
    }

    setUploading(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          avatar_url: filePath,
        },
      });

      if (metadataError) throw metadataError;

      setMessage('Ta photo de profil a été mise à jour avec succès.');
    } catch (cause) {
      console.error('Photo upload failed:', cause);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Impossible de modifier la photo.',
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          AGRONOVA FARM
        </span>

        <h2 className="mt-2 text-xl font-bold text-emerald-950">
          Ma photo de profil
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Personnalise ton espace personnel avec une vraie photo.
        </p>
      </div>

      <div className="mt-7 flex flex-col items-center gap-5 sm:flex-row">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Photo de profil"
            className="h-24 w-24 rounded-full border-4 border-emerald-100 object-cover shadow-md"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-100 text-2xl font-bold text-emerald-900">
            {initials || 'U'}
          </div>
        )}

        <div className="text-center sm:text-left">
          <p className="font-semibold text-stone-900">{displayName}</p>
          <p className="mt-1 text-sm text-stone-500">{user?.email}</p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? 'Envoi en cours...' : 'Changer ma photo'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />

          <p className="mt-2 text-xs text-stone-400">
            JPG, PNG ou autre image — 5 Mo maximum.
          </p>
        </div>
      </div>

      {message && (
        <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
