import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useAuthStore } from '@app/stores';
import { refreshSession } from '@features/auth/api/authApi';
import { TopProgressBar } from '@shared/components';

interface SessionBootstrapProps {
    readonly children: ReactNode;
}

export function SessionBootstrap({ children }: SessionBootstrapProps) {
    const [isRestoring, setIsRestoring] = useState(true);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        void refreshSession()
            .then((session) => {
                if (session) {
                    useAuthStore.getState().login(session.user, session.accessToken);
                }
            })
            .catch(() => undefined)
            .finally(() => setIsRestoring(false));
    }, []);

    if (isRestoring) return <TopProgressBar />;
    return children;
}
