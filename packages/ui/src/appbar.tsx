import { Button } from "./button"

interface AppbarProps {
    user?: {
        name?: string | null;
    },
    // TODO: can u figure out what the type should be here?
    onSignin: () => void | Promise<void>,
    onSignout: () => void | Promise<void>,
    onSignup?: () => void | Promise<void>
}

export const Appbar = ({
    user,
    onSignin,
    onSignout,
    onSignup
}: AppbarProps) => {
    return <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/60 bg-transparent backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4">
            <div className="h-14 flex items-center justify-between">
                <div className="text-lg font-semibold">
                    Manim Studio
                </div>
                <div className="flex items-center gap-2">
                    {user ? (
                        <>
                            <div className="text-sm text-slate-700 mr-2">{user?.name ? `Hi, ${user.name}` : ""}</div>
                            <Button onClick={onSignout}>Logout</Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={onSignin}>Login</Button>
                            {onSignup ? <Button onClick={onSignup}>Sign up</Button> : null}
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
}