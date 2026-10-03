// @vitest-environment happy-dom
import { flushPromises, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PublicProfile } from '@/api/schemas/users'
import { getPublicProfile } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import PublicProfileView from '@/views/PublicProfileView.vue'

vi.mock('@/api/users', () => ({ getPublicProfile: vi.fn() }))

/** Профиль как его видит заглушка ProfileSummary: нужен только логин. */
function profile(login: string): PublicProfile {
  return { login } as PublicProfile
}

/** Ответ, который приходит, когда тест скажет. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}

const ProfileSummary = {
  props: { profile: { type: Object, required: true } },
  template: '<p class="summary">{{ profile.login }}</p>',
}
const LoadState = { template: '<div><slot /></div>' }

function mountView(login: string) {
  return shallowMount(PublicProfileView, {
    props: { login },
    global: { stubs: { ProfileSummary, LoadState, RouterLink: true } },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  const auth = useAuthStore()
  // Вид грузит профиль только для вошедших; сам Me тут не важен.
  auth.$patch((state) => Object.assign(state, { user: { login: 'viewer' } }))
  vi.mocked(getPublicProfile).mockReset()
})

describe('PublicProfileView', () => {
  it('поздний ответ по прежнему логину не перезаписывает новый профиль', async () => {
    const first = deferred<PublicProfile>()
    const second = deferred<PublicProfile>()
    vi.mocked(getPublicProfile)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mountView('e.sokolova')
    await flushPromises()
    await wrapper.setProps({ login: 'i.petrov' })

    second.resolve(profile('i.petrov'))
    await flushPromises()
    first.resolve(profile('e.sokolova'))
    await flushPromises()

    expect(wrapper.get('.summary').text()).toBe('i.petrov')
  })

  it('показывает загруженный профиль', async () => {
    vi.mocked(getPublicProfile).mockResolvedValueOnce(profile('a.morozov'))
    const wrapper = mountView('a.morozov')
    await flushPromises()
    expect(getPublicProfile).toHaveBeenCalledWith('a.morozov')
    expect(wrapper.get('.summary').text()).toBe('a.morozov')
  })
})
