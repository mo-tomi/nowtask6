    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'routine-delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => {
      deleteRoutine(index);
    });

    // 詳細パネル（開始時刻・終了時刻）
    const detailPanel = document.createElement('div');
    detailPanel.className = 'routine-detail-panel';
    detailPanel.style.display = 'none';
    detailPanel.style.flexDirection = 'column';
    detailPanel.style.gap = '8px';
    detailPanel.style.padding = '8px';
    detailPanel.style.width = '100%';
    detailPanel.style.boxSizing = 'border-box';

    // 開始時刻
    const startTimeContainer = document.createElement('div');
    startTimeContainer.style.display = 'flex';
    startTimeContainer.style.alignItems = 'center';
    startTimeContainer.style.gap = '8px';

    const startTimeLabel = document.createElement('label');
    startTimeLabel.textContent = '開始:';
    startTimeLabel.style.minWidth = '60px';
    const startTimeInput = document.createElement('input');
    startTimeInput.type = 'time';
    startTimeInput.className = 'routine-time-input';
    startTimeInput.value = routine.startTime || '';
    startTimeInput.dataset.index = index;
    startTimeInput.dataset.field = 'startTime';
    startTimeInput.style.flex = '1';

    startTimeContainer.appendChild(startTimeLabel);
    startTimeContainer.appendChild(startTimeInput);

    // 終了時刻
    const endTimeContainer = document.createElement('div');
    endTimeContainer.style.display = 'flex';
    endTimeContainer.style.alignItems = 'center';
    endTimeContainer.style.gap = '8px';

    const endTimeLabel = document.createElement('label');
    endTimeLabel.textContent = '終了:';
    endTimeLabel.style.minWidth = '60px';
    const endTimeInput = document.createElement('input');
    endTimeInput.type = 'time';
    endTimeInput.className = 'routine-time-input';
    endTimeInput.value = routine.endTime || '';
    endTimeInput.dataset.index = index;
    endTimeInput.dataset.field = 'endTime';
    endTimeInput.style.flex = '1';

    endTimeContainer.appendChild(endTimeLabel);
    endTimeContainer.appendChild(endTimeInput);

    // 緊急フラグ
    const urgentContainer = document.createElement('div');
    urgentContainer.style.display = 'flex';
    urgentContainer.style.alignItems = 'center';
    urgentContainer.style.gap = '8px';

    const urgentLabel = document.createElement('label');
    urgentLabel.textContent = '緊急:';
    urgentLabel.style.minWidth = '60px';
    const urgentCheckbox = document.createElement('input');
    urgentCheckbox.type = 'checkbox';
    urgentCheckbox.className = 'routine-urgent-input';
    urgentCheckbox.checked = routine.urgent || false;
    urgentCheckbox.dataset.index = index;
    urgentCheckbox.dataset.field = 'urgent';

    urgentContainer.appendChild(urgentLabel);
    urgentContainer.appendChild(urgentCheckbox);

    // 優先順位
    const priorityContainer = document.createElement('div');
    priorityContainer.style.display = 'flex';
    priorityContainer.style.alignItems = 'center';
    priorityContainer.style.gap = '8px';

    const priorityLabel = document.createElement('label');
    priorityLabel.textContent = '優先順位:';
    priorityLabel.style.minWidth = '60px';
    const prioritySelect = document.createElement('select');
    prioritySelect.className = 'routine-priority-input';
    prioritySelect.dataset.index = index;
    prioritySelect.dataset.field = 'priority';
    prioritySelect.style.flex = '1';

    const priorityOptions = [
      { value: '', text: '未設定' },
      { value: 'high', text: '高' },
      { value: 'medium', text: '中' },
      { value: 'low', text: '低' }
    ];

    priorityOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      if (routine.priority === opt.value) {
        option.selected = true;
      }
      prioritySelect.appendChild(option);
    });

    priorityContainer.appendChild(priorityLabel);
    priorityContainer.appendChild(prioritySelect);

    // 期間設定
    const dateRangeLabel = document.createElement('label');
    dateRangeLabel.textContent = '期間:';
    dateRangeLabel.style.width = '100%';
    dateRangeLabel.style.marginTop = '4px';
    dateRangeLabel.style.fontWeight = 'bold';

    const dateRangeContainer = document.createElement('div');
    dateRangeContainer.style.display = 'flex';
    dateRangeContainer.style.flexDirection = 'column';
    dateRangeContainer.style.gap = '4px';
    dateRangeContainer.style.width = '100%';

    // ラジオボタン: 期日なし
    const radioNoneContainer = document.createElement('div');
    const radioNone = document.createElement('input');
    radioNone.type = 'radio';
    radioNone.name = `routine-daterange-${index}`;
    radioNone.value = 'none';
    radioNone.className = 'routine-daterange-radio';
    radioNone.dataset.index = index;
    const dateRange = routine.dateRange || { type: 'none' };
    radioNone.checked = dateRange.type === 'none';

    const radioNoneLabel = document.createElement('label');
    radioNoneLabel.textContent = '期日なし（毎日）';
    radioNoneLabel.style.marginLeft = '4px';
    radioNoneContainer.appendChild(radioNone);
    radioNoneContainer.appendChild(radioNoneLabel);

    // ラジオボタン: 期間設定
    const radioPeriodContainer = document.createElement('div');
    const radioPeriod = document.createElement('input');
    radioPeriod.type = 'radio';
    radioPeriod.name = `routine-daterange-${index}`;
    radioPeriod.value = 'period';
    radioPeriod.className = 'routine-daterange-radio';
    radioPeriod.dataset.index = index;
    radioPeriod.checked = dateRange.type === 'period';

    const radioPeriodLabel = document.createElement('label');
    radioPeriodLabel.textContent = '期間設定';
    radioPeriodLabel.style.marginLeft = '4px';
    radioPeriodContainer.appendChild(radioPeriod);
    radioPeriodContainer.appendChild(radioPeriodLabel);

    // 期間設定の日付入力フィールド
    const periodInputsContainer = document.createElement('div');
    periodInputsContainer.style.display = dateRange.type === 'period' ? 'flex' : 'none';
    periodInputsContainer.style.flexDirection = 'column';
    periodInputsContainer.style.gap = '4px';
    periodInputsContainer.style.marginLeft = '20px';
    periodInputsContainer.className = 'routine-period-inputs';
    periodInputsContainer.dataset.index = index;

    const startDateContainer = document.createElement('div');
    startDateContainer.style.display = 'flex';
    startDateContainer.style.alignItems = 'center';
    startDateContainer.style.gap = '8px';

    const startDateLabel = document.createElement('label');
    startDateLabel.textContent = '開始日:';
    startDateLabel.style.minWidth = '60px';
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.className = 'routine-daterange-start';
    startDateInput.value = dateRange.startDate || '';
    startDateInput.dataset.index = index;
    startDateInput.style.flex = '1';

    startDateContainer.appendChild(startDateLabel);
    startDateContainer.appendChild(startDateInput);

    const endDateContainer = document.createElement('div');
    endDateContainer.style.display = 'flex';
    endDateContainer.style.alignItems = 'center';
    endDateContainer.style.gap = '8px';

    const endDateLabel = document.createElement('label');
    endDateLabel.textContent = '終了日:';
    endDateLabel.style.minWidth = '60px';
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.className = 'routine-daterange-end';
    endDateInput.value = dateRange.endDate || '';
    endDateInput.dataset.index = index;
    endDateInput.style.flex = '1';

    endDateContainer.appendChild(endDateLabel);
    endDateContainer.appendChild(endDateInput);

    periodInputsContainer.appendChild(startDateContainer);
    periodInputsContainer.appendChild(endDateContainer);

    // ラジオボタン変更時の処理
    radioNone.addEventListener('change', () => {
      if (radioNone.checked) {
        periodInputsContainer.style.display = 'none';
      }
    });
    radioPeriod.addEventListener('change', () => {
      if (radioPeriod.checked) {
        periodInputsContainer.style.display = 'flex';
      }
    });

    dateRangeContainer.appendChild(radioNoneContainer);
    dateRangeContainer.appendChild(radioPeriodContainer);
    dateRangeContainer.appendChild(periodInputsContainer);

    detailPanel.appendChild(startTimeContainer);
    detailPanel.appendChild(endTimeContainer);
    detailPanel.appendChild(urgentContainer);
    detailPanel.appendChild(priorityContainer);
    detailPanel.appendChild(dateRangeLabel);
    detailPanel.appendChild(dateRangeContainer);

    // アイテムに追加
    item.appendChild(nameInput);
    item.appendChild(durationInput);
    item.appendChild(detailBtn);
    item.appendChild(deleteBtn);
    item.appendChild(detailPanel);
    container.appendChild(item);
  });
  } catch (e) {
    console.error('Error in renderRoutinesList:', e);
    alert('ルーティンリストの表示エラー: ' + e.message);
  }
}

// ルーティンを削除
function deleteRoutine(index) {
  const routines = getRoutines();
  routines.splice(index, 1);
  saveRoutines(routines);
