export default function ResponsiveStyles({ css }: { css: string }) {
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
