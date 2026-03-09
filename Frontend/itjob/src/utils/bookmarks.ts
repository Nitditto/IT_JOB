// Bookmark utility — localStorage-based job bookmarks

const STORAGE_KEY = 'it_job_bookmarks';

export interface BookmarkedJob {
    id: number;
    name: string;
    companyName: string;
    companyAvatar: string;
    minSalary: number;
    maxSalary: number;
    position: string;
    workstyle: string;
    location: string;
    tags: string[];
    savedAt: string; // ISO date
}

export const getBookmarks = (): BookmarkedJob[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const isBookmarked = (jobId: number): boolean => {
    return getBookmarks().some(j => j.id === jobId);
};

export const addBookmark = (job: BookmarkedJob): void => {
    const bookmarks = getBookmarks().filter(j => j.id !== job.id);
    bookmarks.unshift({ ...job, savedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new Event('bookmarks-changed'));
};

export const removeBookmark = (jobId: number): void => {
    const bookmarks = getBookmarks().filter(j => j.id !== jobId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new Event('bookmarks-changed'));
};

export const toggleBookmark = (job: BookmarkedJob): boolean => {
    if (isBookmarked(job.id)) {
        removeBookmark(job.id);
        return false;
    } else {
        addBookmark(job);
        return true;
    }
};

export const getBookmarkCount = (): number => {
    return getBookmarks().length;
};
