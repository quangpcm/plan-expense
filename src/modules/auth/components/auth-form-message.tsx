type AuthFormMessageProps = {
  type: 'error' | 'success';
  message: string;
};

export function AuthFormMessage({ type, message }: AuthFormMessageProps) {
  return (
    <div
      className={
        type === 'error'
          ? 'rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700'
          : 'rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
      }
    >
      {message}
    </div>
  );
}

