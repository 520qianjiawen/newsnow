import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useCallback } from "react"

const userAtom = atomWithStorage<{
  name?: string
  avatar?: string
}>("user", {})

const jwtAtom = atomWithStorage("jwt", "")

export function useLogin() {
  const [userInfo] = useAtom(userAtom)
  const [jwt, setJwt] = useAtom(jwtAtom)
  const login = useCallback(() => {
    window.location.href = __LOGIN_URL__
  }, [])

  return {
    loggedIn: !!jwt,
    userInfo,
    logout: () => setJwt(""),
    login,
  }
}
