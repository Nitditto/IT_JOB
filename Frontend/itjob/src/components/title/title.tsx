export const Title = (props: { text: string }) => {
    const { text } = props
    return (
        <>
            <h2 className="mb-[30px] text-[28px] font-bold text-slate-900 dark:text-white">
                {text}
            </h2>
        </>
    )
}
