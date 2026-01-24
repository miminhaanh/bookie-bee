import { useMemo } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

interface UserTourProps {
  run: boolean;
  onFinish: () => void;
}

export const UserTour = ({ run, onFinish }: UserTourProps) => {
  const steps = useMemo<Step[]>(
    () => [
      {
        target: ".profile-card-tour",
        content: "Đây là cấp độ và kinh nghiệm của bạn. Đọc càng nhiều, level càng cao!",
        disableBeacon: true,
      },
      {
        target: ".sidebar-add-book",
        content: "Bấm vào đây để bắt đầu hành trình bằng cách thêm cuốn sách đầu tiên của bạn.",
      },
      {
        target: ".nav-reports",
        content: "Xem báo cáo chi tiết về thói quen đọc và nhiệm vụ hàng ngày tại đây.",
      },
    ],
    []
  );

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#f472b6",
          zIndex: 9999,
        },
      }}
      locale={{
        back: "Quay lại",
        close: "Đóng",
        last: "Đã hiểu",
        next: "Tiếp theo",
        skip: "Bỏ qua",
      }}
    />
  );
};
