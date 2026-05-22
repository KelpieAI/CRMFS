import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { FieldChange } from '../hooks/useFormChangeTracker';

interface PendingNavigation {
  to: string;
  replace?: boolean;
}

interface NavigationGuardContextType {
  hasUnsavedChanges: boolean;
  changedFields: FieldChange[];
  memberName: string | null;
  memberId: string | null;
  pendingNavigation: PendingNavigation | null;
  setUnsavedChanges: (
    hasChanges: boolean,
    fields: FieldChange[],
    memberName: string | null,
    memberId: string | null
  ) => void;
  clearUnsavedChanges: () => void;
  requestNavigation: (to: string, replace?: boolean) => boolean;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  onSaveAndNavigate: ((reason: string) => Promise<void>) | null;
  setOnSaveAndNavigate: (handler: ((reason: string) => Promise<void>) | null) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changedFields, setChangedFields] = useState<FieldChange[]>([]);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [onSaveAndNavigate, setOnSaveAndNavigateState] = useState<((reason: string) => Promise<void>) | null>(null);

  const setUnsavedChanges = useCallback((
    hasChanges: boolean,
    fields: FieldChange[],
    name: string | null,
    id: string | null
  ) => {
    setHasUnsavedChanges(hasChanges);
    setChangedFields(fields);
    setMemberName(name);
    setMemberId(id);
  }, []);

  const clearUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    setChangedFields([]);
    setMemberName(null);
    setMemberId(null);
    setPendingNavigation(null);
    setOnSaveAndNavigateState(null);
  }, []);

  const requestNavigation = useCallback((to: string, replace?: boolean): boolean => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ to, replace });
      return false;
    }
    return true;
  }, [hasUnsavedChanges]);

  const confirmNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  const setOnSaveAndNavigate = useCallback((handler: ((reason: string) => Promise<void>) | null) => {
    setOnSaveAndNavigateState(() => handler);
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handlePopState = () => {
      if (hasUnsavedChanges) {
        window.history.pushState(null, '', location.pathname + location.search);
        setPendingNavigation({ to: 'back', replace: true });
      }
    };

    window.history.pushState(null, '', location.pathname + location.search);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, location.pathname, location.search]);

  return (
    <NavigationGuardContext.Provider
      value={{
        hasUnsavedChanges,
        changedFields,
        memberName,
        memberId,
        pendingNavigation,
        setUnsavedChanges,
        clearUnsavedChanges,
        requestNavigation,
        confirmNavigation,
        cancelNavigation,
        onSaveAndNavigate,
        setOnSaveAndNavigate,
      }}
    >
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error('useNavigationGuard must be used within a NavigationGuardProvider');
  }
  return context;
}
