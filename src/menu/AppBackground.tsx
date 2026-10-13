interface AppBackgroundProps {
  calm: boolean;
}

export function AppBackground({ calm }: AppBackgroundProps) {
  const className = calm ? 'bg bg--calm' : 'bg';
  return (
    <div className={className} aria-hidden="true">
      <div className="bg__blob bg__blob--a" />
      <div className="bg__blob bg__blob--b" />
      <div className="bg__blob bg__blob--c" />
      <div className="bg__grid" />
    </div>
  );
}
