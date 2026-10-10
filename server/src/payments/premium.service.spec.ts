import { AppSetting } from './app-setting.entity.js';
import { PremiumService } from './premium.service.js';

/** Builds a repository stub; findOne/create/persist/flush mirror EntityRepository. */
function makeRepo(existing: AppSetting | null) {
  const created: AppSetting[] = [];
  const em = {
    persist: vi.fn().mockReturnThis(),
    flush: vi.fn().mockResolvedValue(undefined),
  };
  const repo = {
    findOne: vi.fn().mockResolvedValue(existing),
    create: vi.fn().mockImplementation((data: { key: string; value: string }) => {
      const entity = { key: data.key, value: data.value } as AppSetting;
      created.push(entity);
      return entity;
    }),
    assign: vi.fn(),
    getEntityManager: vi.fn().mockReturnValue(em),
  };
  return { repo, em, created };
}

function makeService(existing: AppSetting | null) {
  const { repo, em, created } = makeRepo(existing);
  const service = new PremiumService(repo as never);
  return { service, repo, em, created };
}

describe('PremiumService', () => {
  it('seeds the flag to false when no row exists yet', async () => {
    const { service, created } = makeService(null);
    await expect(service.getIsPremium()).resolves.toBe(false);
    expect(created).toEqual([{ key: 'isPremium', value: 'false' }]);
  });

  it('returns true for an existing true row', async () => {
    const { service } = makeService({ key: 'isPremium', value: 'true' });
    await expect(service.getIsPremium()).resolves.toBe(true);
  });

  it('returns false for an existing false row', async () => {
    const { service } = makeService({ key: 'isPremium', value: 'false' });
    await expect(service.getIsPremium()).resolves.toBe(false);
  });

  it('setIsPremium assigns and flushes an existing row', async () => {
    const existing = { key: 'isPremium', value: 'false' };
    const { service, repo, em } = makeService(existing);
    await service.setIsPremium(true);
    expect(repo.assign).toHaveBeenCalledWith(existing, { value: 'true' });
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('setIsPremium creates and persists the row when absent', async () => {
    const { service, created, em } = makeService(null);
    await service.setIsPremium(true);
    expect(created).toEqual([{ key: 'isPremium', value: 'true' }]);
    expect(em.persist).toHaveBeenCalled();
    expect(em.flush).toHaveBeenCalledTimes(1);
  });
});
