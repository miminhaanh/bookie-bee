import ReaderContainer from "@/components/reader";

/**
 * Reader Page Wrapper
 * 
 * This component acts as a simple routing wrapper for the Reader feature.
 * All business logic, UI components, and state management have been moved
 * to @/components/reader for better organization and reusability.
 */
const ReaderPage = () => {
  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      <ReaderContainer />
    </div>
  );
};

export default ReaderPage;
