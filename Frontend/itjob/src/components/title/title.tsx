export const Title = (props: {
  text: string
}) => {
  const { text } = props;
  return (
    <>
      <h2 className="font-bold sm:text-[28px] text-[24px] text-slate-900 dark:text-white text-center mb-[30px]">
        {text}
      </h2>
    </>
  )
}