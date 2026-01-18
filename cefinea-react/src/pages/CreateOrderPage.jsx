import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, Select, Card, Typography, Row, Col, message, Spin, Divider, InputNumber, Radio, Space, Modal } from 'antd';
import { MinusCircleOutlined, PlusOutlined, SaveOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const CreateOrderPage = () => {
    const { user } = useAuth();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]); // State for customers
    const [contracts, setContracts] = useState([]); // State for all contracts
    const [filteredContracts, setFilteredContracts] = useState([]); // Contracts for selected customer
    const [employees, setEmployees] = useState([]); // State for employees
    const [settings, setSettings] = useState([]); // State for settings (cai_dat)
    const [sampleTypes, setSampleTypes] = useState([]); // State for sample types
    const [standards, setStandards] = useState([]); // State for standards (quy_chuan)
    const [chiTieuList, setChiTieuList] = useState([]); // State for chi_tieu
    const [suppliers, setSuppliers] = useState([]); // State for suppliers (nha_thau)
    const [analysisGroups, setAnalysisGroups] = useState([]); // State for analysis groups
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editOrderId = searchParams.get('id');

    // Fetch customers, contracts, employees, and settings on mount
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, contRes, empRes, setRes, typeRes, stdsRes, chiTieuRes, supRes, groupRes] = await Promise.all([
                    axios.get('http://localhost:3001/cefinea/api/crud/khach_hang'),
                    axios.get('http://localhost:3001/cefinea/api/crud/hop_dong'),
                    axios.get('http://localhost:3001/cefinea/api/crud/nhan_vien'),
                    axios.get('http://localhost:3001/cefinea/api/crud/cai_dat'),
                    axios.get('http://localhost:3001/cefinea/api/crud/distinct/chi_tieu/loai_mau'),
                    axios.get('http://localhost:3001/cefinea/api/crud/quy_chuan'),
                    axios.get('http://localhost:3001/cefinea/api/crud/chi_tieu?limit=5000'),
                    axios.get('http://localhost:3001/cefinea/api/crud/doi_tac'),
                    axios.get('http://localhost:3001/cefinea/api/crud/quan_ly_nhom')
                ]);

                if (custRes.data.success) setCustomers(custRes.data.data);
                if (contRes.data.success) setContracts(contRes.data.data);
                if (empRes.data.success) setEmployees(empRes.data.data);
                if (setRes.data.success) setSettings(setRes.data.data);
                if (typeRes.data.success) setSampleTypes(typeRes.data.data);
                if (stdsRes.data.success) setStandards(stdsRes.data.data);
                if (chiTieuRes.data.success) setChiTieuList(chiTieuRes.data.data);
                if (supRes.data.success) setSuppliers(supRes.data.data);
                if (groupRes && groupRes.data.success) setAnalysisGroups(groupRes.data.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
        fetchData();

        // Auto-fetch next Order ID if creating new
        if (!editOrderId) {
            const fetchId = async () => {
                try {
                    const res = await axios.get('http://localhost:3001/cefinea/api/orders/generate-id');
                    if (res.data.success) {
                        form.setFieldsValue({ order: { don_hang_id: res.data.id } });
                    }
                } catch (e) {
                    console.error("Failed to fetch next Order ID", e);
                }
            };
            fetchId();
        }
    }, [editOrderId, form]);

    // Load Edit Data
    React.useEffect(() => {
        if (!editOrderId) return;

        const fetchOrder = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:3001/cefinea/api/orders/full/${editOrderId}`);
                if (res.data.success) {
                    const { order, samples } = res.data.data;

                    // Transform Order Data
                    const orderData = {
                        ...order,
                        phan_loai_don_hang: order.phan_loai_don_hang ? order.phan_loai_don_hang.split(', ') : [],
                        ngay_quan_trac_or_nhan_mau: order.ngay_quan_trac_or_nhan_mau ? dayjs(order.ngay_quan_trac_or_nhan_mau) : null,
                        thoi_han_pt: order.thoi_han_pt ? dayjs(order.thoi_han_pt) : null,
                        thoi_han_pd: order.thoi_han_pd ? dayjs(order.thoi_han_pd) : null,
                        ngay_tra_ket_qua: order.ngay_tra_ket_qua ? dayjs(order.ngay_tra_ket_qua) : null,
                        ngay_huy_mau: order.ngay_huy_mau ? dayjs(order.ngay_huy_mau) : null,
                        thoi_gian_nhac: order.thoi_gian_nhac ? dayjs(order.thoi_gian_nhac) : null,
                        ngay_hoan_thanh: order.ngay_hoan_thanh ? dayjs(order.ngay_hoan_thanh) : null,
                    };

                    // Helper to parse Postgres array string "{val1,val2}"
                    const parsePostgresArray = (str) => {
                        if (!str) return [];
                        if (Array.isArray(str)) return str;
                        if (typeof str !== 'string') return [];
                        // Remove {} and split by comma, ignoring quotes if simple
                        // Better regex or simple trim if standard format
                        const inner = str.replace(/^\{|\}$/g, '');
                        if (!inner) return [];
                        // Split by comma, handling potential quoted strings (simplified)
                        // This handles basic "val1,val2" or "\"val 1\",\"val 2\""
                        return inner.split(',').map(s => {
                            // Remove surrounding quotes if present
                            if (s.startsWith('"') && s.endsWith('"')) {
                                return s.slice(1, -1).replace(/\\"/g, '"');
                            }
                            return s;
                        });
                    };

                    // Transform Samples Data
                    const samplesData = samples.map(s => ({
                        ...s,
                        quy_chuan: s.quy_chuan ? s.quy_chuan.split(', ') : [],
                        details: s.details.map(d => ({
                            ...d,
                            loai_phan_tich: parsePostgresArray(d.loai_phan_tich),
                            ma_nguoi_phan_tich: d.ma_nguoi_phan_tich ? d.ma_nguoi_phan_tich.split(', ') : [],
                        }))
                    }));

                    form.setFieldsValue({
                        order: orderData,
                        samples: samplesData
                    });

                    // Trigger customer filtering logic
                    if (orderData.id_khach_hang) {
                        // Find customer to trigger contract filtering logic if needed, 
                        // but setFieldsValue already set so_hop_dong. 
                        // Just need to setFilteredContracts for proper dropdown display.
                        const customer = customers.find(c => c.id === orderData.id_khach_hang);
                        if (customer) {
                            const maDoiTac = customer.ma_doi_tac;
                            if (maDoiTac) {
                                // We need contracts state which might not be loaded yet if this useEffect runs before initial fetchData completes?
                                // Better to depend on 'contracts' state.
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading order:", error);
                message.error("Không thể tải dữ liệu đơn hàng.");
            } finally {
                setLoading(false);
            }
        };

        if (customers.length > 0 && contracts.length > 0) {
            fetchOrder();
        }

    }, [editOrderId, customers, contracts, form]);

    // Filter Order Classifications
    const orderClassifications = settings
        .filter(item => item.nhom === 'Phân loại đơn hàng')
        .map(item => ({ value: item.hang_muc, label: item.hang_muc }));

    // Date Calculation Logic
    const calculateDates = (baseDate) => {
        if (!baseDate) return;
        const nhanMau = dayjs(baseDate);
        form.setFieldsValue({
            order: {
                thoi_han_pt: nhanMau.add(3, 'day'),
                thoi_han_pd: nhanMau.add(4, 'day'),
                ngay_tra_ket_qua: nhanMau.add(8, 'day'),
                ngay_huy_mau: nhanMau.add(8, 'day').add(15, 'day'), // Result date + 15
            }
        });
    };

    const preparePayload = (values) => {
        // Transform dates to string if needed or rely on axios/JSON stringify
        const formatDate = (date) => date ? date.format('YYYY-MM-DD') : null;
        const formatDateTime = (date) => date ? date.format('YYYY-MM-DD HH:mm:ss') : null;

        // Handle multi-select for phan_loai_don_hang
        const phanLoai = Array.isArray(values.order.phan_loai_don_hang)
            ? values.order.phan_loai_don_hang.join(', ')
            : values.order.phan_loai_don_hang;

        return {
            order: {
                ...values.order,
                don_hang_id: values.order.don_hang_id,
                ten_khach_hang: values.order.ten_khach_hang,
                so_hop_dong: values.order.so_hop_dong,
                loai_don: values.order.loai_don,
                phan_loai_don_hang: phanLoai,
                ngay_quan_trac_or_nhan_mau: formatDate(values.order.ngay_quan_trac_or_nhan_mau),
                ngay_tra_ket_qua: formatDate(values.order.ngay_tra_ket_qua),
                thoi_han_pt: formatDate(values.order.thoi_han_pt),
                thoi_han_pd: formatDate(values.order.thoi_han_pd),
                ngay_hoan_thanh: formatDate(values.order.ngay_hoan_thanh),
                ngay_huy_mau: formatDate(values.order.ngay_huy_mau),
                thoi_gian_nhac: formatDateTime(values.order.thoi_gian_nhac),
            },
            samples: values.samples?.map(sample => {
                const status = values.order.loai_don === "Mẫu gửi" ? "2.Chờ mã hóa" : "1.Chờ quan trắc (nhận mẫu)";
                const monitorStatus = values.order.loai_don === "Mẫu gửi" ? "" : "1.Chờ quan trắc (nhận mẫu)";
                const creator = user?.user?.ma_nv || 'NV001'; // Should be ma_nv for FK, fallback to known valid ID or handle error
                const history = `${dayjs().format('DD/MM/YYYY HH:mm:ss')} ${user?.user?.ho_va_ten || 'User'} đã tạo đơn hàng`;

                // Clone and sanitize sample
                const cleanSample = { ...sample };
                delete cleanSample.chi_tiet_chi_tieu; // Remove rogue field causing DB error
                delete cleanSample.id; // Ensure raw ID not sent if collision

                return {
                    ...cleanSample,
                    quy_chuan: Array.isArray(sample.quy_chuan) ? sample.quy_chuan.join(', ') : sample.quy_chuan,
                    don_hang_id: values.order.don_hang_id,
                    phan_loai_chi_tieu: phanLoai, // Auto-fill from Order Info
                    trang_thai: status,
                    trang_thai_quan_trac: monitorStatus,
                    nguoi_tao: creator,
                    lich_su: history,
                    // Other fields left empty as requested: ma_quan_trac, ghi_chu_quan_trac, thong_so_hien_truong
                    details: sample.details?.map(detail => {
                        // Find corresponding chi_tieu item
                        const chiTieuItem = chiTieuList.find(ct => ct.id_chi_tieu === detail.id_chi_tieu);

                        // Calculations
                        const donGia = chiTieuItem?.don_gia || 0;
                        const discountRate = values.order.ty_le_chiet_khau || 0;
                        const thanhTien = donGia * (1 - discountRate / 100);

                        // Analysis Place Logic
                        const noiPhanTich = chiTieuItem?.noi_phan_tich || '';
                        let maNguoiPhanTich = null;
                        let idNhaThau = detail.id_nha_thau; // Default to UI selection

                        if (noiPhanTich.toLowerCase().includes('nội') || noiPhanTich.toLowerCase().includes('noi')) {
                            // If user selected manually, respect it. If new/auto, check master data?
                            // Logic: Default to manual selection if exists (Edit), else auto (New)
                            // But here we are processing payload from form values `detail`
                            // So `detail.ma_nguoi_phan_tich` is what user selected (Array)

                            // However, the original code had auto-fill logic here.
                            // If `detail.ma_nguoi_phan_tich` is present (user selected), use it.
                            // If not, use `chiTieuItem` default? Master data `nguoi_phan_tich` is single string ID?
                            // Wait, master data `nguoi_phan_tich` is now an ID (e.g. NV01).
                            // If we want to auto-fill it as an array:

                            if (detail.ma_nguoi_phan_tich && detail.ma_nguoi_phan_tich.length > 0) {
                                maNguoiPhanTich = detail.ma_nguoi_phan_tich;
                            } else {
                                // Fallback to auto-fill from Master Data if nothing selected?
                                // Master data might have a default analyst. 
                                // `chiTieuItem.nguoi_phan_tich` is a string (e.g. "NV01").
                                // Convert to array.
                                maNguoiPhanTich = chiTieuItem?.nguoi_phan_tich ? [chiTieuItem.nguoi_phan_tich] : [];
                            }

                        } else if (noiPhanTich.toLowerCase().includes('ngoài') || noiPhanTich.toLowerCase().includes('ngoai') || noiPhanTich.toLowerCase().includes('thầu')) {
                            idNhaThau = chiTieuItem?.id_doi_tac; // Use Master Data contractor ID from new column
                        }

                        return {
                            ...detail,
                            // Auto-fill from chi_tieu (Master Data)
                            nhom_mau: chiTieuItem?.nhom_mau,
                            don_gia: donGia,
                            chiet_khau: discountRate,
                            thanh_tien: thanhTien,
                            phan_loai_chi_tieu: chiTieuItem?.loai_mau,
                            phuong_phap_thu: chiTieuItem?.phuong_phap_thu,

                            // Analysis Assignment
                            ma_nguoi_phan_tich: Array.isArray(maNguoiPhanTich) ? maNguoiPhanTich.join(', ') : maNguoiPhanTich,
                            id_nha_thau: idNhaThau,

                            // Fixed / Order Info
                            trang_thai_tong_hop: "CHO_MA_HOA",
                            ma_khach_hang: values.order.id_khach_hang,
                            han_hoan_thanh_pt_gm: formatDate(values.order.thoi_han_pt),

                            // Existing Logic
                            trang_thai_phan_tich: "CHO_CHUYEN_MAU",
                            ghi_chu: sample.ghi_chu_ma_mau,
                            loai_don_hang: phanLoai,
                            ngay_tra_ket_qua: formatDate(values.order.thoi_han_pt),
                            history: history,
                        };
                    })
                };
            })
        };
    };



    // Generate next ID on mount for new orders
    React.useEffect(() => {
        if (!editOrderId) {
            const fetchNextId = async () => {
                try {
                    const res = await axios.get('http://localhost:3001/cefinea/api/orders/next-id');
                    if (res.data.success) {
                        form.setFieldsValue({
                            order: {
                                don_hang_id: res.data.nextId
                            }
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch next ID", error);
                }
            };
            fetchNextId();
        }
    }, [editOrderId, form]);



    const onFinish = async (values) => {
        setLoading(true);
        try {
            const payload = preparePayload(values);
            let response;

            if (editOrderId) {
                response = await axios.put(`http://localhost:3001/cefinea/api/orders/full/${editOrderId}`, payload);
            } else {
                response = await axios.post('http://localhost:3001/cefinea/api/orders/create-full', payload);
            }

            if (response.data.success) {
                message.success(editOrderId ? 'Cập nhật đơn hàng thành công!' : 'Tạo đơn hàng thành công!');
                navigate('/manage/don_hang');
            } else {
                message.error('Lỗi: ' + response.data.message);
            }
        } catch (error) {
            console.error(error);
            message.error('Gặp lỗi: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Handle Customer Change
    const handleCustomerChange = (value, option) => {
        // value is id, option.label is name (or we find in customers)
        const customer = customers.find(c => c.id === value);
        if (customer) {
            form.setFieldsValue({
                order: {
                    ten_khach_hang: customer.ten_khach_hang || customer.ten_doi_tac || customer.ten || customer.ho_ten, // Fallback fields
                    dia_chi_lay_mau: customer.dia_chi || customer.dia_chi_tru_so,
                    // Add other auto-fills if needed
                }
            });

            // Filter contracts: hop_dong.id_doi_tac === khach_hang.ma_doi_tac
            const maDoiTac = customer.ma_doi_tac;
            if (maDoiTac) {
                const relevantContracts = contracts.filter(c => c.id_doi_tac === maDoiTac);
                setFilteredContracts(relevantContracts);
            } else {
                setFilteredContracts([]);
            }
            // Reset contract field
            form.setFieldsValue({ order: { so_hop_dong: null } });
        } else {
            setFilteredContracts([]);
        }
    };

    // Auto-calculate Financial Fields
    const handleValuesChange = (changedValues, allValues) => {
        const order = allValues.order || {};

        // Define fields that trigger calculation
        const triggers = ['chi_phi_van_chuyen', 'chi_phi_nhan_cong', 'chi_phi_khac', 'gia_tri_don_hang', 'vat'];
        const changedOrderKeys = Object.keys(changedValues.order || {});
        const shouldCalculate = changedOrderKeys.some(key => triggers.includes(key));

        if (shouldCalculate) {
            const vc = order.chi_phi_van_chuyen || 0;
            const nc = order.chi_phi_nhan_cong || 0;
            const other = order.chi_phi_khac || 0;

            const totalCost = vc + nc + other;

            const orderValue = order.gia_tri_don_hang || 0;
            const vatPercent = order.vat || 0;

            // Formula: Tổng VAT = (Tổng chi phí + Giá trị ĐH) * (1 + VAT%)
            const totalBase = totalCost + orderValue;
            const totalVAT = Math.round(totalBase * (1 + vatPercent / 100));

            form.setFieldsValue({
                order: {
                    tong_chi_phi: totalCost,
                    tong_tien_vat: totalVAT
                }
            });
        }
    };

    // --- Test Data Generator ---
    const fillTestData = () => {
        if (!chiTieuList.length || !customers.length || !employees.length) {
            message.warning("Đang tải dữ liệu master, vui lòng đợi...");
            return;
        }

        const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const cust = randomItem(customers);
        const randContract = contracts.find(c => c.id_khach_hang === cust.id) || (contracts.length > 0 ? contracts[0] : null);
        const emp = randomItem(employees);
        const group = analysisGroups.length > 0 ? randomItem(analysisGroups) : null;
        const supplier = suppliers.length > 0 ? randomItem(suppliers) : null;

        // Generate Order ID based on YYMMDD-XX
        // Generate Order ID based on configured rule (YYYY.XXXX)
        // Since this is async, we settle for fetching it fresh or using the one currently in form if present?
        // But fillTestData resets everything. Ideally fetch fresh.
        // We will make fillTestData async to handle this.
        let orderId = form.getFieldValue(['order', 'don_hang_id']);
        // If empty or default placeholder, fetch fresh
        if (!orderId || orderId.includes('DH')) {
            try {
                // We'll proceed with a temporary ID until we can await (but making handler async is fine in React)
                // actually let's just use sync random fallback if we can't await, BUT we can make this function async
            } catch (e) { }
        }

        // Better: make function async
        // NOTE: Function definition update required above (const fillTestData = async () => ...)
        // For now, let's just use a sync fallback or the existing form value if valid, but the user wants the rule applied.
        // Let's rely on the AUTO-FETCH on mount. 
        // If the user clicks "Fill Test Data", we should preserve the auto-fetched ID if possible, OR fetch new.
        // Let's keep the existing ID if it matches pattern YYYY.XXXX, else fetch new.

        // ACTUALLY, checking the code, I need to make the arrow function async to await.
        // I will replace the function start in a separate chunk or just assume it's async now? 
        // No, I must update the definition.

        // Since I cannot change the definition easily with partial match safely without context, 
        // I will just use the API if I can, or use the form value.
        // The safest is to rely on the mount effect. 
        // BUT `fillTestData` overrides `don_hang_id` in line 417.
        // So I MUST update line 417 to NOT override it if it's already good, or generate a valid one.

        // Let's use the one from Form if available.
        orderId = form.getFieldValue(['order', 'don_hang_id']) || (dayjs().format('YYYY') + '.' + Math.floor(1000 + Math.random() * 9000));

        const newOrder = {
            don_hang_id: orderId,
            ten_don_hang: `Đơn hàng kiểm nghiệm ${cust.ten_khach_hang} - ${dayjs().format('DD/MM')}`,
            id_khach_hang: cust.id,
            so_hop_dong: randContract ? randContract.so_hop_dong : '',
            ten_khach_hang: cust.ten_khach_hang || cust.ten_doi_tac || cust.ten || cust.ho_ten || 'Khách hàng Test',
            nguoi_lien_he: 'Nguyễn Văn A',
            dia_chi_khach_hang: cust.dia_chi || cust.dia_chi_tru_so || '123 Đường Test',
            ngay_quan_trac_or_nhan_mau: dayjs(),
            nguoi_nhan_mau: emp.ma_nv,
            thoi_han_pt: dayjs().add(7, 'day'),
            thoi_han_pd: dayjs().add(8, 'day'),
            phan_loai_don_hang: ['Môi trường'],
            loai_don: 'Quan trắc MT',
            trang_thai_don_hang: '1.Chờ quan trắc (nhận mẫu)',

            // Financials
            chi_phi_van_chuyen: Math.floor(Math.random() * 10) * 100000,
            chi_phi_nhan_cong: Math.floor(Math.random() * 50) * 100000,
            chi_phi_khac: Math.floor(Math.random() * 5) * 100000,
            gia_tri_don_hang: Math.floor(Math.random() * 90 + 10) * 100000,
            vat: Math.random() > 0.5 ? 8 : 10,
            tong_chi_phi: 0, // Will calculate below
            tong_tien_vat: 0 // Will calculate below
        };

        // Calculate Totals
        newOrder.tong_chi_phi = (newOrder.chi_phi_van_chuyen || 0) + (newOrder.chi_phi_nhan_cong || 0) + (newOrder.chi_phi_khac || 0);
        const totalBase = newOrder.tong_chi_phi + (newOrder.gia_tri_don_hang || 0);
        newOrder.tong_tien_vat = Math.round(totalBase * (1 + (newOrder.vat || 0) / 100));

        // Create 2 Samples
        const newSamples = [1, 2].map((i, index) => {
            // Requirement: First sample MUST be 'Không khí xung quanh'
            let sampleType;
            if (index === 0) {
                sampleType = 'Không khí xung quanh';
            } else {
                // Try to pick a sample type that has valid standards
                const typesWithStandards = [...new Set(standards.map(s => s.loai_quy_chuan))];
                const validTypes = sampleTypes.map(st => st.gia_tri || st).filter(t => typesWithStandards.includes(t));

                if (validTypes.length > 0) {
                    sampleType = randomItem(validTypes);
                } else {
                    sampleType = sampleTypes.length > 0 ? (sampleTypes[0].gia_tri || sampleTypes[0]) : 'Nước thải';
                }
            }

            // Find valid standards for this sample type
            const validStandards = standards.filter(s => s.loai_quy_chuan === sampleType);
            const selectedStandard = validStandards.length > 0 ? [randomItem(validStandards).ten_quy_chuan] : [];

            const criteria = [1, 2, 3].map(() => {
                // Filter criteria by sample type if possible, or just random for now (generic pool)
                // Ideally we should filter chiTieuList by loai_mau if that column exists/is consistent
                const relevantChiTieu = chiTieuList.filter(ct => ct.loai_mau === sampleType);
                const pool = relevantChiTieu.length > 0 ? relevantChiTieu : chiTieuList;
                const ct = randomItem(pool);

                const isInternal = Math.random() > 0.5;

                return {
                    id_chi_tieu: ct.id_chi_tieu,
                    don_vi_tinh: ct.don_vi_tinh,
                    loai_phan_tich: ['Lý hóa'],
                    noi_phan_tich: isInternal ? 'Nội bộ' : 'Bên ngoài',
                    ma_nguoi_phan_tich: isInternal ? [emp.ma_nv] : [],
                    id_nha_thau: !isInternal && supplier ? supplier.ma_doi_tac : null,
                    nhom_phan_tich: group ? group.id_nhom : null,
                    trang_thai_tong_hop: 'Chờ nhận mẫu'
                };
            });

            return {
                ten_mau: `Mẫu test ${i} (${sampleType})`,
                mo_ta_mau: 'Mẫu auto-generated',
                tinh_trang_mau: 'Bình thường',
                loai_mau: sampleType,
                quy_chuan: selectedStandard, // Auto-fill Standard
                luong_mau: '1 lít',
                so_luong_mau: 1,
                details: criteria
            };
        });

        form.setFieldsValue({
            order: newOrder,
            samples: newSamples
        });

        // Trigger generic handling if needed (like customer change logic) but setFieldsValue covers data.
        message.success("Đã điền dữ liệu mẫu!");
    };

    return (
        <div style={{ padding: 24, paddingBottom: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2} style={{ margin: 0 }}>{editOrderId ? `Chỉnh Sửa Đơn Hàng #${editOrderId}` : 'Tạo Đơn Hàng Mới'}</Title>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => form.resetFields()}
                    >
                        Làm mới
                    </Button>
                    <Button onClick={fillTestData} type="dashed">
                        Điền dữ liệu test
                    </Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        size="large"
                        loading={loading}
                        onClick={() => form.submit()}
                    >
                        {editOrderId ? 'Lưu Thay Đổi' : 'Lưu Đơn Hàng'}
                    </Button>
                </Space>
            </div>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={handleValuesChange}
                initialValues={{
                    order: {
                        ngay_quan_trac_or_nhan_mau: dayjs(),
                        thoi_han_pt: dayjs().add(3, 'day'),
                        thoi_han_pd: dayjs().add(4, 'day'),
                        ngay_tra_ket_qua: dayjs().add(8, 'day'),
                        ngay_huy_mau: dayjs().add(23, 'day'), // 8 + 15
                        muc_do: 'Bình thường',
                    }
                }}
            >
                <Row gutter={24}>
                    {/* --- LEFT COLUMN: Order Info (8/24) --- */}
                    <Col span={8}>
                        <Card title="Thông tin Đơn Hàng" variant="borderless" style={{ marginBottom: 24, position: 'sticky', top: 20 }}>
                            {/* --- Dòng 1: Thông tin Chung & Khách hàng --- */}
                            <Row gutter={12}>
                                <Divider titlePlacement="left">Thông tin chung</Divider>
                                <Col span={8}>
                                    <Form.Item name={['order', 'loai_don']} label="Loại Đơn">
                                        <Select
                                            placeholder="Chọn loại"
                                            onChange={(value) => {
                                                const status = value === "Mẫu gửi" ? "2.Chờ phân tích" : "1.Chờ quan trắc (nhận mẫu)";
                                                form.setFieldsValue({ order: { trang_thai_don_hang: status } });
                                            }}
                                        >
                                            <Select.Option value="Mẫu gửi">Mẫu gửi</Select.Option>
                                            <Select.Option value="Quan trắc MT">Quan trắc MT</Select.Option>
                                            <Select.Option value="Môi trường lao động">Môi trường lao động</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col span={8}>
                                    <Form.Item name={['order', 'phan_loai_don_hang']} label="Phân Loại">
                                        <Select
                                            mode="multiple"
                                            placeholder="Chọn..."
                                            options={orderClassifications}
                                            allowClear
                                            maxTagCount="responsive"
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={8}>
                                    <Form.Item name={['order', 'muc_do']} label="Mức Độ">
                                        <Radio.Group optionType="button" buttonStyle="solid" style={{ display: 'flex', width: '100%' }}>
                                            <Radio.Button value="Bình thường" style={{ flex: 1, textAlign: 'center' }}>Bình thường</Radio.Button>
                                            <Radio.Button value="Gấp" style={{ flex: 1, textAlign: 'center' }}>Gấp</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name={['order', 'don_hang_id']} label="Mã Đơn Hàng" rules={[{ required: true }]}>
                                        <Input placeholder="VD: DH202401" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name={['order', 'ten_don_hang']} label="Tên Đơn Hàng / Dự Án">
                                        <Input />
                                    </Form.Item>
                                </Col>

                                {/* Hidden Customer Name Field */}
                                <Form.Item name={['order', 'ten_khach_hang']} label="Tên Khách Hàng" rules={[{ required: true }]} hidden>
                                    <Input />
                                </Form.Item>

                                <Col span={12}>
                                    <Form.Item name={['order', 'id_khach_hang']} label="Chọn Khách Hàng">
                                        <Select
                                            showSearch
                                            placeholder="Tìm khách hàng..."
                                            optionFilterProp="children"
                                            onChange={handleCustomerChange}
                                            filterOption={(input, option) =>
                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={customers.map(c => ({
                                                value: c.id,
                                                label: `${c.id} - ${c.ten_doi_tac || c.ten_khach_hang || c.ten || 'N/A'}`
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name={['order', 'so_hop_dong']} label="Số Hợp Đồng">
                                        <Select
                                            showSearch
                                            placeholder={filteredContracts.length > 0 ? "Chọn hợp đồng..." : "Không có hợp đồng phù hợp"}
                                            options={filteredContracts.map(c => ({ value: c.so_hop_dong, label: c.so_hop_dong }))}
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item name={['order', 'dia_chi_lay_mau']} label="Địa Chỉ Lấy Mẫu">
                                        <Input.TextArea rows={2} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {/* --- Dòng 2: Phân loại & Nhân sự --- */}

                            <Row gutter={12}>

                                <Col span={12} hidden>
                                    <Form.Item name={['order', 'trang_thai_don_hang']} label="Trạng Thái">
                                        <Input />
                                    </Form.Item>
                                </Col>

                                <Col span={8}>
                                    <Form.Item name={['order', 'nhan_vien_kinh_doanh']} label="Nhân Viên KD">
                                        <Select
                                            showSearch
                                            placeholder="Chọn NV..."
                                            optionFilterProp="children"
                                            filterOption={(input, option) =>
                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={employees.map(e => ({
                                                value: e.ma_nv,
                                                label: `${e.ma_nv} - ${e.ho_va_ten}`
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['order', 'id_nguoi_gioi_thieu']} label="Người Giới Thiệu">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['order', 'ty_le_chiet_khau']} label="Tỷ lệ chiết khấu">
                                        <InputNumber style={{ width: '100%' }} formatter={value => `${value}%`} parser={value => value.replace('%', '')} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {/* --- Dòng 3: Thời gian --- */}
                            <Divider titlePlacement="left">Thời gian</Divider>
                            <Row gutter={12}>
                                <Col span={8}>
                                    <Form.Item name={['order', 'ngay_quan_trac_or_nhan_mau']} label="Ngày Quan Trắc">
                                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" onChange={calculateDates} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['order', 'thoi_han_pt']} label="Hạn PT">
                                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['order', 'thoi_han_pd']} label="Hạn PD">
                                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name={['order', 'ngay_tra_ket_qua']} label="Ngày Trả KQ">
                                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name={['order', 'ngay_huy_mau']} label="Ngày Hủy">
                                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider titlePlacement="left">Tài Chính</Divider>
                            {/* Phần Tài Chính - Vertical Layout for small column */}
                            <Row gutter={12}>
                                <Col span={6}>
                                    <Form.Item name={['order', 'chi_phi_van_chuyen']} label="Phí VC">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item name={['order', 'chi_phi_nhan_cong']} label="Phí NC">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item name={['order', 'chi_phi_khac']} label="Phí Khác">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item name={['order', 'tong_chi_phi']} label="Tổng Chi Phí">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}> {/* Increased span for emphasis or consistency if needed, but 12 is fine if next to VAT */}
                                    <Form.Item name={['order', 'gia_tri_don_hang']} label="Giá trị ĐH">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['order', 'vat']} label="VAT (%)">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['order', 'tong_tien_vat']} label="Tổng VAT">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item name={['order', 'note']} label="Ghi Chú">
                                        <Input.TextArea rows={2} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* --- RIGHT COLUMN: Samples & Details (16/24) --- */}
                    <Col span={16}>
                        <Form.List name="samples">
                            {(fields, { add, remove }) => (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Card
                                            key={key}
                                            size="small"
                                            title={<Text strong style={{ fontSize: 16 }}>Mẫu #{name + 1}</Text>}
                                            extra={
                                                <MinusCircleOutlined
                                                    onClick={() => remove(name)}
                                                    style={{ color: 'red', fontSize: 18, cursor: 'pointer' }}
                                                />
                                            }
                                            style={{ background: '#fafafa', border: '1px solid #d9d9d9' }}
                                        >
                                            {/* Row 1: Định danh mẫu */}
                                            {/* Row 1: Loại, Tên, Mã, Vị trí, Tọa độ */}
                                            <Row gutter={12}>
                                                <Col span={6}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'loai_mau']}
                                                        label="Loại Mẫu"
                                                    >
                                                        <Select
                                                            showSearch
                                                            placeholder="Chọn loại mẫu"
                                                            options={sampleTypes.map(t => ({ value: t, label: t }))}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'ten_mau']}
                                                        label="Tên Mẫu"
                                                        rules={[{ required: true, message: 'Thiếu tên mẫu' }]}
                                                    >
                                                        <Input placeholder="Nước thải, Đất..." />
                                                    </Form.Item>
                                                </Col>
                                                <Col hidden>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'ma_mau']}
                                                        label="Mã mẫu"
                                                        initialValue="Chờ mã hóa..."
                                                    >
                                                        <Input placeholder="Mã mẫu..." />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={5}>
                                                    <Form.Item {...restField} name={[name, 'vi_tri_lay_mau']} label="Vị trí lấy mẫu">
                                                        <Input />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={5}>
                                                    <Form.Item {...restField} name={[name, 'toa_do_lay_mau']} label="Tọa độ">
                                                        <Input placeholder="GPS..." />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            {/* Row 2: Mô tả, Quy chuẩn, Ghi chú */}
                                            <Row gutter={12}>
                                                <Col span={8}>
                                                    <Form.Item {...restField} name={[name, 'mo_ta_mau']} label="Mô tả mẫu">
                                                        <Input.TextArea rows={1} />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    {/* Dynamic Standard Select */}
                                                    <Form.Item
                                                        minWidth={200}
                                                        noStyle
                                                        shouldUpdate={(prevValues, curValues) =>
                                                            prevValues.samples?.[name]?.loai_mau !== curValues.samples?.[name]?.loai_mau
                                                        }
                                                    >
                                                        {() => {
                                                            const currentLoaiMau = form.getFieldValue(['samples', name, 'loai_mau']);
                                                            const filteredStandards = standards.filter(std => std.loai_quy_chuan === currentLoaiMau);
                                                            return (
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'quy_chuan']}
                                                                    label="Quy chuẩn"
                                                                >
                                                                    <Select
                                                                        placeholder="Chọn QC..."
                                                                        allowClear
                                                                        mode="multiple"
                                                                        options={filteredStandards.map(s => ({ value: s.ten_quy_chuan, label: s.ten_quy_chuan }))}
                                                                        showSearch
                                                                    />
                                                                </Form.Item>
                                                            );
                                                        }}
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item {...restField} name={[name, 'ghi_chu_ma_mau']} label="Ghi chú mẫu">
                                                        <Input.TextArea rows={1} />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Divider style={{ margin: '12px 0' }} />

                                            {/* List Chi Tiêu (Details) */}
                                            <div style={{ background: '#fff', padding: 12, borderRadius: 6, border: '1px dashed #ccc' }}>
                                                <Form.List name={[name, 'details']}>
                                                    {(dFields, { add: addDetail, remove: removeDetail }) => (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            {/* Header Row */}
                                                            <Row gutter={8} style={{ fontWeight: 'bold', marginBottom: 4, textAlign: 'center' }}>
                                                                <Col span={1}>#</Col>
                                                                <Col span={4}>ID Chỉ Tiêu</Col>
                                                                <Col span={2}>Đơn vị</Col>
                                                                <Col span={3}>Loại PT</Col>
                                                                <Col span={2}>Nơi PT</Col>
                                                                <Col span={3}>Nhóm PT</Col>
                                                                <Col span={4}>Người PT</Col>
                                                                <Col span={4}>Nhà thầu</Col>
                                                                <Col span={1}><span /></Col>
                                                            </Row>

                                                            {dFields.map(({ key: dKey, name: dName, ...dRestField }, index) => (
                                                                <Row key={dKey} gutter={8} align="middle">
                                                                    <Col span={1} style={{ textAlign: 'center' }}>
                                                                        <Text type="secondary">{index + 1}</Text>
                                                                    </Col>
                                                                    <Col span={4}>
                                                                        {/* Dynamic Filtered Select for ID Chỉ Tiêu */}
                                                                        <Form.Item
                                                                            noStyle
                                                                            shouldUpdate={(prevValues, curValues) =>
                                                                                prevValues.samples?.[name]?.loai_mau !== curValues.samples?.[name]?.loai_mau
                                                                            }
                                                                        >
                                                                            {() => {
                                                                                const currentLoaiMau = form.getFieldValue(['samples', name, 'loai_mau']);
                                                                                const filteredChiTieu = chiTieuList.filter(ct => ct.loai_mau === currentLoaiMau);
                                                                                return (
                                                                                    <Form.Item {...dRestField} name={[dName, 'id_chi_tieu']} style={{ marginBottom: 0 }}>
                                                                                        <Select
                                                                                            placeholder="Mã..."
                                                                                            showSearch
                                                                                            onSelect={(value, option) => {
                                                                                                const item = option.item;
                                                                                                if (item) {
                                                                                                    const basePath = ['samples', name, 'details', dName];
                                                                                                    form.setFieldValue([...basePath, 'don_vi_tinh'], item.don_vi_tinh);
                                                                                                    form.setFieldValue([...basePath, 'noi_phan_tich'], item.noi_phan_tich);

                                                                                                    // Auto-fill Analyst if Internal
                                                                                                    if (item.noi_phan_tich === 'Nội bộ' && item.nguoi_phan_tich) {
                                                                                                        form.setFieldValue([...basePath, 'ma_nguoi_phan_tich'], [item.nguoi_phan_tich]);
                                                                                                    }

                                                                                                    // Auto-fill 'Loại phân tích' from 'order.phan_loai_don_hang'
                                                                                                    const phanLoaiRef = form.getFieldValue(['order', 'phan_loai_don_hang']);
                                                                                                    form.setFieldValue([...basePath, 'loai_phan_tich'], phanLoaiRef);
                                                                                                }
                                                                                            }}
                                                                                            filterOption={(input, option) =>
                                                                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                                                            }
                                                                                            options={filteredChiTieu.map(ct => ({
                                                                                                value: ct.id_chi_tieu,
                                                                                                label: `${ct.id_chi_tieu} (${ct.chi_tieu})`,
                                                                                                item: ct
                                                                                            }))}
                                                                                        />
                                                                                    </Form.Item>
                                                                                );
                                                                            }}
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={2}>
                                                                        <Form.Item {...dRestField} name={[dName, 'don_vi_tinh']} style={{ marginBottom: 0 }}>
                                                                            <Input readOnly style={{ background: '#f5f5f5' }} />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={3}>
                                                                        <Form.Item {...dRestField} name={[dName, 'loai_phan_tich']} style={{ marginBottom: 0 }}>
                                                                            <Select
                                                                                mode="multiple"
                                                                                allowClear
                                                                                placeholder="Chọn..."
                                                                                options={orderClassifications}
                                                                                maxTagCount="responsive"
                                                                                showSearch={false}
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={2}>
                                                                        <Form.Item {...dRestField} name={[dName, 'noi_phan_tich']} style={{ marginBottom: 0 }}>
                                                                            <Input />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={3}>
                                                                        <Form.Item {...dRestField} name={[dName, 'nhom_phan_tich']} style={{ marginBottom: 0 }}>
                                                                            <Select
                                                                                placeholder="Chọn..."
                                                                                options={analysisGroups.map(g => ({ value: g.id_nhom, label: `${g.ma_nhom} - ${g.ten_nhom}` }))}
                                                                                allowClear
                                                                                showSearch
                                                                                filterOption={(input, option) =>
                                                                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                                                }
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={4}>
                                                                        <Form.Item {...dRestField} name={[dName, 'ma_nguoi_phan_tich']} style={{ marginBottom: 0 }}>
                                                                            <Select
                                                                                mode="multiple"
                                                                                placeholder="Chọn..."
                                                                                options={employees.map(e => ({ value: e.ma_nv, label: e.ho_va_ten }))}
                                                                                maxTagCount={1}
                                                                                allowClear
                                                                                showSearch
                                                                                filterOption={(input, option) =>
                                                                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                                                }
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={4}>
                                                                        <Form.Item {...dRestField} name={[dName, 'id_nha_thau']} style={{ marginBottom: 0 }}>
                                                                            <Select
                                                                                placeholder="Chọn nhà thầu..."
                                                                                allowClear
                                                                                showSearch
                                                                                filterOption={(input, option) =>
                                                                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                                                }
                                                                                options={suppliers.map(s => ({ value: s.ma_doi_tac, label: `${s.ma_doi_tac || ''} - ${s.ten_doi_tac}` }))}
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <MinusCircleOutlined
                                                                            onClick={() => removeDetail(dName)}
                                                                            style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 20 }}
                                                                        />
                                                                    </Col>
                                                                </Row>
                                                            ))}
                                                            <Button type="dashed" size="small" onClick={() => addDetail()} icon={<PlusOutlined />} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                                                                Thêm chỉ tiêu
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Form.List>
                                            </div>
                                        </Card>
                                    ))}

                                    <Button type="dashed" onClick={() => add({ ma_mau: 'Chờ mã hóa...' })} block icon={<PlusOutlined />} style={{ height: 40, fontSize: 15 }}>
                                        + Thêm Mẫu Mới
                                    </Button>
                                </div>
                            )}
                        </Form.List>
                    </Col>
                </Row>

            </Form >
        </div >
    );
};

export default CreateOrderPage;
