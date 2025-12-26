import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  CreditCard,
  Search,
  Inbox,
  Plus,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionTo?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  secondaryActionLabel,
  secondaryActionTo,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
        <Icon className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {actionLabel && (
          <>
            {actionTo ? (
              <Link
                to={actionTo}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md"
              >
                <Plus className="h-5 w-5 mr-2" />
                {actionLabel}
              </Link>
            ) : (
              <button
                onClick={onAction}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md"
              >
                <Plus className="h-5 w-5 mr-2" />
                {actionLabel}
              </button>
            )}
          </>
        )}
        {secondaryActionLabel && (
          <>
            {secondaryActionTo ? (
              <Link
                to={secondaryActionTo}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {secondaryActionLabel}
              </Link>
            ) : (
              <button
                onClick={onSecondaryAction}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {secondaryActionLabel}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Pre-built Empty States for Common Scenarios

export function NoMembersEmpty() {
  return (
    <EmptyState
      icon={Users}
      title="No members yet"
      description="Get started by adding your first member to the funeral service."
      actionLabel="Add Member"
      actionTo="/members/new"
    />
  );
}

export function NoPaymentsEmpty() {
  return (
    <EmptyState
      icon={CreditCard}
      title="No payments recorded"
      description="Payment records will appear here once members start making payments."
      actionLabel="Add Member"
      actionTo="/members/new"
    />
  );
}

export function NoReportsEmpty() {
  return (
    <EmptyState
      icon={FileText}
      title="No data available"
      description="Reports will be generated once you have member and payment data."
      actionLabel="Add Member"
      actionTo="/members/new"
    />
  );
}

export function NoSearchResultsEmpty({ searchTerm }: { searchTerm?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find any results for "${searchTerm}". Try adjusting your search.`
          : "We couldn't find any results. Try adjusting your filters or search term."
      }
      actionLabel="Clear Search"
      onAction={() => window.location.reload()}
    />
  );
}

export function NoApplicationsEmpty() {
  return (
    <EmptyState
      icon={FileText}
      title="No saved applications"
      description="Applications saved in progress will appear here. Start a new registration to save your progress."
      actionLabel="New Registration"
      actionTo="/members/new"
    />
  );
}

export function ErrorEmpty({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something went wrong"
      description={message || 'We encountered an error loading this data. Please try again.'}
      actionLabel="Retry"
      onAction={onRetry || (() => window.location.reload())}
      secondaryActionLabel="Go to Dashboard"
      secondaryActionTo="/"
    />
  );
}

// Empty State Wrapper for Conditional Rendering
interface EmptyStateWrapperProps {
  isEmpty: boolean;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent: ReactNode;
  children: ReactNode;
}

export function EmptyStateWrapper({
  isEmpty,
  isLoading = false,
  loadingComponent,
  emptyComponent,
  children,
}: EmptyStateWrapperProps) {
  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  if (isEmpty) {
    return <>{emptyComponent}</>;
  }

  return <>{children}</>;
}