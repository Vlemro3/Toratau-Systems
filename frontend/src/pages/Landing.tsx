import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const SECTION_PY = { xs: 5, sm: 6, md: 8 };
const CONTAINER_PX = { xs: 2, sm: 3 };

const Landing: React.FC = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showPolicy, setShowPolicy] = useState(false);
  const [showLicense, setShowLicense] = useState(false);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header — компактный на мобиле, удобные зоны нажатия */}
      <Box
        component="header"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
          <Box
            sx={{
              py: { xs: 1.25, sm: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="Toratau"
                sx={{
                  width: { xs: 36, sm: 32 },
                  height: { xs: 36, sm: 32 },
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: 700, letterSpacing: 0.3, fontSize: { xs: '1.1rem', sm: 'inherit' } }}
                >
                  Toratau
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  Управление объектами
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="text"
                color="inherit"
                href="/login"
                sx={{
                  minHeight: { xs: 44, sm: 36 },
                  px: { xs: 1.5, sm: 1 },
                  fontSize: { xs: '0.95rem', sm: 'inherit' },
                }}
              >
                Войти
              </Button>
              <Button
                variant="contained"
                color="primary"
                href="/register"
                sx={{
                  minHeight: { xs: 44, sm: 36 },
                  px: { xs: 2, sm: 1.5 },
                  fontSize: { xs: '0.9rem', sm: 'inherit' },
                }}
              >
                Зарегистрироваться
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* HERO */}
        <Box
          component="section"
          sx={{
            pt: { xs: 4, sm: 6, md: 10 },
            pb: { xs: 4, sm: 6, md: 10 },
            bgcolor:
              theme.palette.mode === 'light'
                ? 'grey.50'
                : theme.palette.background.default,
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 4, sm: 4, md: 6 }} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={{ xs: 2.5, sm: 3 }}>
                  <Chip
                    label="Хотите знать сколько потратили на объекте?"
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />

                  <Typography
                    variant={isMdUp ? 'h3' : 'h4'}
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.15,
                      fontSize: { xs: '1.65rem', sm: '2rem', md: 'inherit' },
                    }}
                  >
                    Программа для управления строительной компанией
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      maxWidth: 520,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      lineHeight: 1.6,
                    }}
                  >
                    Вы открываете объект — и за 10 секунд понимаете ситуацию
                    <br />
                    Прорабы фиксируют выполненные работы за 30 секунд
                    <br />
                    Начните видеть реальную прибыль уже сегодня
                  </Typography>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ '& .MuiButton-root': { minHeight: isMobile ? 48 : 42 } }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      href="/register"
                      endIcon={<ArrowForwardIcon />}
                      fullWidth={isMobile}
                    >
                      Попробовать бесплатно
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      href="/login"
                      fullWidth={isMobile}
                    >
                      Войти
                    </Button>
                  </Stack>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ maxWidth: 320, display: 'block' }}
                  >
                    14 дней бесплатно, тарифные планы от 500 рублей/месяц
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: { xs: 2, md: 3 },
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    border: theme.palette.mode === 'light' ? '1px solid' : undefined,
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    component="img"
                    src="/dashboard-preview.png"
                    alt="Пример дашборда Toratau — сводка по объекту, финансы, бюджет"
                    sx={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ПРОБЛЕМА */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                  ПРОБЛЕМА
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Нет понимания и прозрачности реального движения денег по объектам
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                  Без единой картины по объектам и подрядчикам до 5–15% бюджета
                  уходит в неучтённый перерасход, споры по выплатам и «потерянные»
                  объёмы. Вы узнаёте о проблеме постфактум — когда терять уже нечего.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Grid container spacing={2}>
                  {[
                    {
                      title: 'Кто сколько сделал — в чатах и таблицах',
                      text: 'Объёмы по подрядчикам размазаны по Excel и перепискам. Свести в одну картину и увидеть перерасход вовремя невозможно.',
                    },
                    {
                      title: 'План-факт узнаёте, когда уже поздно',
                      text: 'Отклонения всплывают в конце этапа или при конфликте. Решения принимаются по ощущениям, а не по цифрам.',
                    },
                    {
                      title: 'Споры по выплатам и «забытые» объёмы',
                      text: 'Подрядчики и прорабы помнят по-разному. Нет единой базы работ и начислений — только претензии и задержки.',
                    },
                    {
                      title: 'Несколько объектов — хаос в отчётности',
                      text: 'Сводки собираются вручную, ошибки копятся. Руководитель не видит, где реально теряются деньги.',
                    },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.title}>
                      <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, borderStyle: 'dashed' }}>
                        <CardContent sx={{ p: { xs: 2.5, sm: 2 } }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: 'inherit' } }}>
                            {item.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ПРОБЛЕМА С ПРОРАБАМИ */}
        <Box
          component="section"
          sx={{
            py: SECTION_PY,
            bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'background.paper',
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Stack spacing={1} sx={{ mb: { xs: 3, md: 4 } }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                ПРОБЛЕМА С ПРОРАБАМИ
              </Typography>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Прорабы не хотят заполнять документы — и это убивает внедрение
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.6 }}>
                Им мешают страх контроля, отсутствие личной выгоды, нежелание тратить время и привычка к хаосу.
                Если система усложняет жизнь прораба — она не приживётся. Нужно дать владельцу контроль и одновременно — выгоду прорабу.
              </Typography>
            </Stack>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                  Почему прорабы саботируют отчётность
                </Typography>
                <Stack component="ul" spacing={1} sx={{ pl: 2.5, m: 0, '& li': { fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.5 } }}>
                  <li>Боятся контроля и что вскроются перерасходы</li>
                  <li>Не видят личной выгоды от заполнения</li>
                  <li>Не хотят тратить время на «бумажки»</li>
                  <li>Привыкли к хаосу и работе «в голове»</li>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
                  Почему они будут использовать Toratau
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                  Всё заполнение — в несколько кнопок, всегда под рукой: быстрее мессенджеров, проще Excel, выгоднее учёта «в голове».
                </Typography>
                <Stack spacing={1}>
                  {[
                    'Быстрый расчёт зарплаты и прозрачный учёт бонусов',
                    'Защита от обвинений: фотофиксация как доказательство',
                    'Упрощённая отчётность — минимум действий, максимум ясности',
                  ].map((item) => (
                    <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ fontSize: 20, color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ФУНКЦИОНАЛ — подробно */}
        <Box
          component="section"
          sx={{
            py: SECTION_PY,
            bgcolor: theme.palette.mode === 'light' ? 'background.default' : 'grey.900',
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Stack spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                ФУНКЦИОНАЛ
              </Typography>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Что умеет Toratau: полный цикл по объекту и подрядчикам
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620, lineHeight: 1.6 }}>
                От создания объекта и справочника расценок до учёта работ, начислений,
                выплат и отчётов — всё в одном месте. Ниже кратко по возможностям системы.
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              {[
                {
                  title: 'Объекты и сводка',
                  text: 'Создаёте объекты с датами старта и сдачи, плановой себестоимостью и суммой контракта. По каждому объекту — сводка: дни до сдачи, приход денег, баланс (касса), факт расход, начисления и выплаты подрядчикам. Статусы: в работе, новый, завершён, в архиве.',
                },
                {
                  title: 'Работы и расценки',
                  text: 'Справочник видов работ с расценками (за единицу объёма). Прорабы или офис вносят выполненные объёмы по объекту и подрядчику. Система сама считает начисления по расценкам. Удобно смотреть, кто сколько сделал и сколько начислено.',
                },
                {
                  title: 'Расходы и выплаты подрядчикам',
                  text: 'Учёт прочих расходов по объекту (материалы, транспорт и т.п.) и фактических выплат подрядчикам. Видно приход денег, освоение бюджета, структуру расходов (подрядчики / прочие) и по категориям. План-факт по объекту в одном экране.',
                },
                {
                  title: 'Подрядчики и контакты',
                  text: 'Справочник подрядчиков с привязкой к объектам. По каждому подрядчику — начислено и выплачено. Поиск, сортировка, удобная таблица на десктопе и в мобильной версии.',
                },
                {
                  title: 'План-факт и риск',
                  text: 'Сравнение плановой себестоимости с фактическими расходами. Индикатор риска по объекту. Оплата контракта и освоение бюджета — в процентах и в деньгах, с наглядными шкалами.',
                },
                {
                  title: 'Несколько объектов и роли',
                  text: 'Все объекты в одном аккаунте: список с фильтром по статусу и поиском. Разделение прав: администратор настраивает объекты и справочники, прорабы могут вносить работы. Журнал действий (AuditLog) фиксирует изменения для контроля.',
                },
              ].map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 2 } }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1.5,
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.55 }}>
                        {item.text}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* КАК ЭТО РАБОТАЕТ */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                  ПРОСТОЙ СТАРТ
                </Typography>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Как это работает
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                  Запуск — часы, не месяцы. Создаёте объект, добавляете подрядчиков и расценки.
                  Прорабы или офис вводят объёмы работ, вы видите начисления и план-факт в одном месте. Без внедренцев.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Grid container spacing={2}>
                  {[
                    { step: '1', title: 'Создайте объект', text: 'Укажите название, даты, сумму контракта и плановую себестоимость. Добавьте подрядчиков и виды работ с расценками.' },
                    { step: '2', title: 'Вносите работы и выплаты', text: 'Фиксируйте выполненные объёмы по подрядчикам — начисления считаются автоматически. Вносите фактические расходы и выплаты.' },
                    { step: '3', title: 'Смотрите сводку и план-факт', text: 'По каждому объекту: приход денег, баланс, факт расход, начисления и выплаты. Риск и освоение бюджета — на одном экране.' },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={item.step}>
                      <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', position: 'relative' }}>
                        <CardContent sx={{ p: { xs: 2.5, sm: 2.5 } }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {item.step}
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, pr: 4 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.5 }}>
                            {item.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ДЛЯ КОГО / ПРЕИМУЩЕСТВА */}
        <Box
          component="section"
          sx={{
            py: SECTION_PY,
            bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'background.paper',
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 1, fontWeight: 600 }}
                >
                  ДЛЯ КОГО
                </Typography>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Кому подходит Toratau
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 3 }}>
                  {[
                    'Малые подрядчики',
                    'Девелоперы',
                    'Компании с несколькими объектами',
                  ].map((item) => (
                    <Box
                      key={item}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'primary.contrastText',
                          }}
                        />
                      </Box>
                      <Typography variant="body2">{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 1, fontWeight: 600 }}
                >
                  ПРЕИМУЩЕСТВА
                </Typography>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Что вы получаете
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {[
                    {
                      title: 'Меньше перерасхода — экономия 3–7% бюджета',
                      text: 'План-факт по каждому объекту и подрядчику. Вы видите отклонения до того, как они превращаются в потери.',
                    },
                    {
                      title: 'Выплаты без споров',
                      text: 'Каждая сумма привязана к объёмам и расценкам в системе. Нет «я сделал больше» — есть факт в одном месте.',
                    },
                    {
                      title: 'Контроль без тотальной опеки',
                      text: 'Руководство видит маржу и риски по объектам. Не нужно выбивать отчёты у прорабов и сводить таблицы.',
                    },
                    {
                      title: 'Один вход — все объекты',
                      text: 'Объекты, подрядчики, работы и выплаты в одном интерфейсе. История действий сохраняется — можно проверить любое решение.',
                    },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.title}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          height: '100%',
                          borderColor: 'transparent',
                          bgcolor:
                            theme.palette.mode === 'light'
                              ? 'common.white'
                              : 'grey.900',
                        }}
                      >
                        <CardContent sx={{ p: { xs: 2.5, sm: 2 } }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.5 }}>
                            {item.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* МОБИЛЬНАЯ ВЕРСИЯ */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                  МОБИЛЬНАЯ ВЕРСИЯ
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Удобно с телефона: объекты, бюджет и подрядчики под рукой
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 520, lineHeight: 1.6 }}>
                  Сводка по объекту, финансы, структура расходов и таблица подрядчиков —
                  в удобном мобильном интерфейсе. Проверяйте цифры и принимайте решения без ноутбука.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    width: { xs: '100%', sm: 200, md: 200 },
                    maxWidth: 220,
                  }}
                >
                  <Box
                    component="img"
                    src="/mobile-screenshot-1.png"
                    alt="Мобильная версия — бюджет и структура расходов по объекту"
                    sx={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </Card>
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    width: { xs: '100%', sm: 200, md: 200 },
                    maxWidth: 220,
                  }}
                >
                  <Box
                    component="img"
                    src="/mobile-screenshot-2.png"
                    alt="Мобильная версия — список объектов и карточки проектов"
                    sx={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ТАРИФЫ */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Stack spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                ТАРИФЫ
              </Typography>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Простая линейка тарифов
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                Стоимость указана за месяц использования портала. Цены за всю компанию; при оплате за год — скидка 10%.
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              {[
                { name: 'Start', price: '500 ₽/мес', limit: 'До 3 объектов', highlighted: false },
                { name: 'Business', price: '1 000 ₽/мес', limit: 'До 6 объектов', highlighted: true },
                { name: 'Premium', price: '2 000 ₽/мес', limit: 'До 10 объектов', highlighted: false },
                { name: 'Unlim', price: '10 000 ₽/мес', limit: 'Объектов без ограничений', highlighted: false },
              ].map((plan) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={plan.name}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      height: '100%',
                      borderColor: plan.highlighted ? 'primary.main' : 'divider',
                      boxShadow: plan.highlighted ? 4 : 0,
                      position: 'relative',
                    }}
                  >
                    {plan.highlighted && (
                      <Chip
                        label="Популярный выбор"
                        color="primary"
                        size="small"
                        sx={{ position: 'absolute', top: 12, right: 12 }}
                      />
                    )}
                    <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                        {plan.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {plan.limit}
                      </Typography>
                      <Button
                        variant={plan.highlighted ? 'contained' : 'outlined'}
                        color="primary"
                        fullWidth
                        href="/register"
                        sx={{ minHeight: { xs: 48 } }}
                      >
                        Начать бесплатно
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* FAQ */}
        <Box
          component="section"
          sx={{
            py: SECTION_PY,
            bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'background.paper',
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                  FAQ
                </Typography>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Сомневаетесь? Вот ответы
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                  Типичные вопросы перед стартом — и короткие ответы, чтобы снять возражения и принять решение.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={1.5}>
                  {[
                    {
                      q: 'Сложно внедрять? Нужны ли программисты?',
                      a: 'Нет. Вы создаёте объекты и подрядчиков, прорабы вводят объёмы работ. Запуск за 1–2 дня, без внедренцев. Инструкции и при необходимости онлайн-разбор первых шагов.',
                    },
                    {
                      q: 'Не заменяет ли это бухгалтерию? Придётся всё перестраивать?',
                      a: 'Toratau — управленческий учёт по объектам и подрядчикам. Бухгалтерию не трогаем: при необходимости выгружаете данные в нужном формате.',
                    },
                    {
                      q: 'Как считаются начисления подрядчикам?',
                      a: 'Задаёте расценки по видам работ. При вводе объёма система сама считает начисления по этапу и подрядчику — без пересчётов в Excel.',
                    },
                    {
                      q: 'У нас несколько объектов. Всё в одной системе?',
                      a: 'Да. Один вход — все объекты. Детализация по каждому и сводная картина по компании. Так и задумано.',
                    },
                    {
                      q: 'Безопасно ли хранить данные у вас?',
                      a: 'Доступ по ролям, передача по защищённым каналам. Каждое действие фиксируется в журнале — можно проверить, кто что изменил.',
                    },
                    {
                      q: 'Чем это лучше Excel и чатов?',
                      a: 'Один источник правды: объёмы, начисления и выплаты в системе, а не в разрозненных файлах и переписках. План-факт в реальном времени, без ручных сводок.',
                    },
                    {
                      q: 'Что если не подойдёт после теста?',
                      a: '14 дней бесплатно, без карты. Не понравится — просто не продлеваете. Данные можно выгрузить.',
                    },
                  ].map((item, index) => (
                    <Accordion
                      key={index}
                      disableGutters
                      square={false}
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:before': { display: 'none' },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          px: { xs: 2, sm: 2 },
                          minHeight: { xs: 52 },
                          '& .MuiAccordionSummary-content': { my: 1.5 },
                        }}
                      >
                        <Typography variant="subtitle2">
                          {item.q}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 2, pb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: 13.5 }}
                        >
                          {item.a}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ФИНАЛЬНЫЙ CTA */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Card
              elevation={4}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor:
                  theme.palette.mode === 'light'
                    ? 'primary.main'
                    : 'primary.dark',
                color: 'primary.contrastText',
              }}
            >
              <Grid container>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Перестаньте терять на перерасходе — начните с одного объекта
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="inherit"
                        href="/register"
                        sx={{ color: 'primary.main', fontWeight: 600, minHeight: { xs: 48 } }}
                      >
                        Создать портал бесплатно
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        href="/login"
                        sx={{ borderColor: 'rgba(255,255,255,0.6)', color: 'inherit', minHeight: { xs: 48 } }}
                      >
                        Войти
                      </Button>
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{ mt: 2, display: 'block', opacity: 0.8 }}
                    >
                      Без обязательств. Откажетесь — просто не продлеваете.
                    </Typography>
                  </Box>
                </Grid>
                <Grid
                  size={{ xs: 12, md: 5 }}
                  sx={{
                    borderLeft: {
                      xs: 'none',
                      md: '1px solid rgba(255,255,255,0.16)',
                    },
                    display: 'flex',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Мини mock-дашборд в CTA */}
                  <Box
                    sx={{
                      p: { xs: 3, md: 4 },
                      width: '100%',
                      bgcolor: 'rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.9, mb: 0.5 }}
                    >
                      Пример дашборда Toratau
                    </Typography>
                    <Card
                      sx={{
                        borderRadius: 2,
                        bgcolor: 'rgba(0,0,0,0.16)',
                        color: 'inherit',
                        boxShadow: 'none',
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="caption">
                            Прибыль по объектам
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.8 }}
                          >
                            месяц
                          </Typography>
                        </Stack>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mt: 0.5 }}
                        >
                          + 4 800 000 ₽
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'success.light' }}
                        >
                          +6,2% к плану
                        </Typography>
                      </CardContent>
                    </Card>
                    <Grid container spacing={1}>
                      {['Объекты', 'Подрядчики', 'Выплаты'].map((label, idx) => (
                        <Grid size={{ xs: 4 }} key={label}>
                          <Card
                            sx={{
                              borderRadius: 2,
                              bgcolor: 'rgba(0,0,0,0.16)',
                              color: 'inherit',
                              boxShadow: 'none',
                            }}
                          >
                            <CardContent sx={{ p: 1.25 }}>
                              <Typography
                                variant="caption"
                                sx={{ opacity: 0.8 }}
                              >
                                {label}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {idx === 0
                                  ? '7'
                                  : idx === 1
                                  ? '24'
                                  : '3,9 млн ₽'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{ borderTop: `1px solid ${theme.palette.divider}`, py: { xs: 3, sm: 4 } }}
      >
        <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                АО «Стройинтеграция»
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
                ИНН 9731148947
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6, mt: 0.5 }}>
                121351, г. Москва, ул. Партизанская,
                <br />
                д. 35, к. 3, помещ. 2/1
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Контакты
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
                Телефон:{' '}
                <Box component="a" href="tel:+79173600091" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                  +7 917 360 00 91
                </Box>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6, mt: 0.5 }}>
                E-mail:{' '}
                <Box component="a" href="mailto:4997829@mail.ru" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                  4997829@mail.ru
                </Box>
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Информация
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  display: 'block',
                  '&:hover': { opacity: 0.8 },
                }}
                onClick={() => setShowPolicy(true)}
              >
                Политика в отношении обработки персональных данных
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  display: 'block',
                  mt: 0.75,
                  '&:hover': { opacity: 0.8 },
                }}
                onClick={() => setShowLicense(true)}
              >
                Лицензионное соглашение об использовании функционала сервиса
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} Toratau. Все права защищены.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Сервис для управления объектами в строительстве.
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Модальное окно — Политика обработки персональных данных */}
      {showPolicy && (
        <Box
          onClick={() => setShowPolicy(false)}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              maxWidth: 720,
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                Политика в отношении обработки персональных данных
              </Typography>
              <Button onClick={() => setShowPolicy(false)} sx={{ minWidth: 0, p: 0.5, fontSize: 22, lineHeight: 1, color: 'text.secondary' }}>
                ×
              </Button>
            </Box>
            <Box sx={{ px: 3, py: 2, overflowY: 'auto', fontSize: 14, lineHeight: 1.7, '& h3': { mt: 2.5, mb: 1, fontSize: 15, fontWeight: 700 }, '& p': { mb: 1.5, color: 'text.secondary' }, '& ul': { pl: 2.5, mb: 1.5 }, '& li': { mb: 0.5, color: 'text.secondary' } }}>
              <h3>1. Общие положения</h3>
              <p>
                Настоящая Политика в отношении обработки персональных данных (далее — Политика) разработана в соответствии с Федеральным законом от 27.07.2006 №152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению их безопасности, предпринимаемые АО «Стройинтеграция» (далее — Оператор).
              </p>
              <p>
                Оператор ставит важнейшей целью и условием осуществления своей деятельности соблюдение прав и свобод человека и гражданина при обработке его персональных данных, в том числе защиты прав на неприкосновенность частной жизни, личную и семейную тайну.
              </p>
              <p>
                Настоящая Политика применяется ко всей информации, которую Оператор может получить о пользователях сервиса «ТОРАТАУ», расположенного по адресу{' '}
                <a href="https://xn--80adjbxkgkgn3age6ate4b4a7b9a.xn--p1ai/" target="_blank" rel="noopener noreferrer">https://программадлястроителей.рф/</a>.
              </p>

              <h3>2. Основные понятия</h3>
              <p>
                <strong>Персональные данные</strong> — любая информация, относящаяся прямо или косвенно к определённому или определяемому физическому лицу (субъекту персональных данных).
              </p>
              <p>
                <strong>Обработка персональных данных</strong> — любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу (распространение, предоставление, доступ), обезличивание, блокирование, удаление, уничтожение персональных данных.
              </p>
              <p>
                <strong>Пользователь</strong> — любое лицо, имеющее доступ к сервису «ТОРАТАУ» посредством сети Интернет.
              </p>

              <h3>3. Состав обрабатываемых персональных данных</h3>
              <p>Оператор может обрабатывать следующие персональные данные Пользователя:</p>
              <ul>
                <li>Фамилия, имя, отчество</li>
                <li>Электронный адрес (e-mail)</li>
                <li>Номер телефона</li>
                <li>Наименование организации</li>
                <li>Должность</li>
                <li>Данные, автоматически передаваемые в процессе использования сервиса (IP-адрес, данные cookies, информация о браузере и операционной системе, время доступа)</li>
              </ul>

              <h3>4. Цели обработки персональных данных</h3>
              <p>Персональные данные Пользователя обрабатываются в следующих целях:</p>
              <ul>
                <li>Регистрация и идентификация Пользователя в сервисе «ТОРАТАУ»</li>
                <li>Предоставление Пользователю доступа к функциям сервиса</li>
                <li>Связь с Пользователем для направления уведомлений, запросов и информации, касающейся использования сервиса</li>
                <li>Улучшение качества сервиса и разработка новых функций</li>
                <li>Проведение статистических и иных исследований на основе обезличенных данных</li>
                <li>Исполнение требований законодательства Российской Федерации</li>
              </ul>

              <h3>5. Правовые основания обработки персональных данных</h3>
              <p>Оператор обрабатывает персональные данные Пользователя на следующих правовых основаниях:</p>
              <ul>
                <li>Согласие субъекта персональных данных на обработку его персональных данных</li>
                <li>Договор, стороной которого является субъект персональных данных (пользовательское соглашение, договор оферты)</li>
                <li>Федеральные законы и иные нормативно-правовые акты в сфере защиты персональных данных</li>
              </ul>

              <h3>6. Порядок обработки персональных данных</h3>
              <p>
                Обработка персональных данных осуществляется с согласия субъекта персональных данных, за исключением случаев, предусмотренных законодательством.
              </p>
              <p>
                Оператор осуществляет хранение персональных данных в форме, позволяющей определить субъекта персональных данных, не дольше, чем этого требуют цели обработки, если иное не предусмотрено договором или действующим законодательством.
              </p>
              <p>
                Оператор обеспечивает сохранность персональных данных и принимает все возможные меры, исключающие доступ к персональным данным неуполномоченных лиц.
              </p>

              <h3>7. Трансграничная передача персональных данных</h3>
              <p>
                Оператор до начала осуществления трансграничной передачи персональных данных обязан убедиться в том, что иностранным государством, на территорию которого предполагается передача, обеспечивается надёжная защита прав субъектов персональных данных.
              </p>

              <h3>8. Права субъекта персональных данных</h3>
              <p>Пользователь имеет право:</p>
              <ul>
                <li>Получать информацию, касающуюся обработки его персональных данных</li>
                <li>Требовать уточнения его персональных данных, их блокирования или уничтожения в случае, если персональные данные являются неполными, устаревшими, неточными, незаконно полученными</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Обжаловать действия или бездействие Оператора в уполномоченный орган по защите прав субъектов персональных данных или в судебном порядке</li>
              </ul>

              <h3>9. Меры по защите персональных данных</h3>
              <p>Оператор принимает необходимые и достаточные организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, предоставления, распространения, а также от иных неправомерных действий в отношении персональных данных, в том числе:</p>
              <ul>
                <li>Назначение ответственного за организацию обработки персональных данных</li>
                <li>Применение организационных и технических мер по обеспечению безопасности</li>
                <li>Контроль за принимаемыми мерами обеспечения безопасности</li>
                <li>Обнаружение фактов несанкционированного доступа к персональным данным и принятие мер</li>
                <li>Использование шифрования (SSL/TLS) при передаче данных</li>
              </ul>

              <h3>10. Контактная информация Оператора</h3>
              <p>
                <strong>АО «Стройинтеграция»</strong>
                <br />ИНН 9731148947
                <br />121351, г. Москва, ул. Партизанская, д. 35, к. 3, помещ. 2/1
                <br />Электронная почта: <a href="mailto:4997829@mail.ru">4997829@mail.ru</a>
                <br />Телефон: <a href="tel:+79173600091">+7 917 360 00 91</a>
                <br />Сайт: <a href="https://xn--80adjbxkgkgn3age6ate4b4a7b9a.xn--p1ai/" target="_blank" rel="noopener noreferrer">https://программадлястроителей.рф/</a>
              </p>

              <h3>11. Заключительные положения</h3>
              <p>
                Настоящая Политика может быть изменена или дополнена Оператором. Новая редакция Политики вступает в силу с момента её размещения на сайте сервиса «ТОРАТАУ», если иное не предусмотрено новой редакцией Политики.
              </p>
              <p>
                Действующая редакция Политики размещена на странице по адресу{' '}
                <a href="https://xn--80adjbxkgkgn3age6ate4b4a7b9a.xn--p1ai/" target="_blank" rel="noopener noreferrer">https://программадлястроителей.рф/</a>.
              </p>
            </Box>
          </Box>
        </Box>
      )}

      {/* Модальное окно — Лицензионное соглашение */}
      {showLicense && (
        <Box
          onClick={() => setShowLicense(false)}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              maxWidth: 760,
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                Лицензионное соглашение об использовании функционала сервиса
              </Typography>
              <Button onClick={() => setShowLicense(false)} sx={{ minWidth: 0, p: 0.5, fontSize: 22, lineHeight: 1, color: 'text.secondary' }}>
                ×
              </Button>
            </Box>
            <Box sx={{ px: 3, py: 2, overflowY: 'auto', fontSize: 14, lineHeight: 1.7, '& h3': { mt: 2.5, mb: 1, fontSize: 15, fontWeight: 700 }, '& p': { mb: 1.5, color: 'text.secondary' }, '& ul,& ol': { pl: 2.5, mb: 1.5 }, '& li': { mb: 0.5, color: 'text.secondary' } }}>

              <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', mb: 0.5 }}>
                ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', mb: 0.5, fontWeight: 600 }}>
                ОБ ИСПОЛЬЗОВАНИИ ФУНКЦИОНАЛА СЕРВИСА ТОРАТАУ
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                Редакция от «01» января 2026
              </Typography>

              <p>
                Настоящее лицензионное соглашение (далее – Соглашение) определяет порядок использования Сервиса ТОРАТАУ, расположенного на сайте{' '}
                <a href="https://xn--80adjbxkgkgn3age6ate4b4a7b9a.xn--p1ai/" target="_blank" rel="noopener noreferrer">https://программадлястроителей.рф/</a>, и является публичной офертой акционерного общества «СТРОЙИНТЕГРАЦИЯ» (далее – Компания) в соответствии со ст. 437 ГК РФ. Соглашение адресовано любому лицу (далее – Клиент) на изложенных ниже условиях.
              </p>
              <p>
                Безусловным принятием (акцептом) условий Соглашения считается оплата Клиентом Счета-договора. Настоящее Соглашение является неотъемлемой частью Счета-договора.
              </p>
              <p>
                <strong>Сайт</strong> — сайт Компании, расположенный по адресу:{' '}
                <a href="https://xn--80adjbxkgkgn3age6ate4b4a7b9a.xn--p1ai/" target="_blank" rel="noopener noreferrer">https://программадлястроителей.рф/</a>{' '}
                (включая поддомены).
              </p>
              <p>
                <strong>Сервис</strong> — программный комплекс Компании, который состоит из Сайта и предназначен для управления строительными объектами.
              </p>
              <p><strong>Реквизиты доступа</strong> — комбинация логина и пароля для доступа Клиента к Сервису.</p>
              <p>
                <strong>Тариф</strong> — система ставок оплаты за предоставление доступа к Сервису, которая доступна на Сайте по адресу{' '}
                <a href="https://xn--80adjbxkgkgn3age6ate4b4a7b9a.xn--p1ai/" target="_blank" rel="noopener noreferrer">https://программадлястроителей.рф/</a>.
              </p>
              <p><strong>Счет-договор</strong> — документ, который Компания составляет и направляет Клиенту для оплаты.</p>
              <p><strong>УПД</strong> — универсальный передаточный документ, включающий в себя счет-фактуру и акт оказанных Услуг за Отчетный период.</p>
              <p><strong>Отчетный период</strong> — календарный месяц. В случае предоставления доступа к Сервису не с начала календарного месяца, отчетным периодом является количество дней с даты предоставления доступа к Сервису до окончания календарного месяца.</p>
              <p><strong>Политика</strong> — Политика Компании в отношении обработки персональных данных, расположена на сайте.</p>

              <h3>1. Предмет</h3>
              <p>1.1. Компания предоставляет Клиенту неисключительную лицензию на использование Сервиса без права заключения сублицензионных соглашений с третьими лицами, а Клиент оплачивает Компании вознаграждение в соответствии с Тарифом.</p>

              <h3>2. Регистрация в Сервисе</h3>
              <p>2.1. Для подачи заявки на доступ к Сервису Клиент вводит в специальную форму на Сайте необходимые достоверные данные.</p>
              <p>2.2. Компания обрабатывает полученные от Клиента данные в том виде, в котором они были получены.</p>
              <p>2.3. Для согласования срока доступа к Сервису Компания связывается с Клиентом по контактным данным, которые он предоставил.</p>
              <p>2.4. После согласования срока доступа к Сервису Компания направляет на электронную почту Клиента Счет-договор.</p>
              <p>2.5. Клиент обязуется оплатить Счет-договор в течение 3 (трёх) рабочих дней с момента его получения.</p>
              <p>2.6. После оплаты Счет-договора Компания направляет Клиенту Реквизиты доступа на указанную им электронную почту.</p>

              <h3>3. Доступ к Сервису</h3>
              <p>3.1. Право использования Сервиса предоставляется Клиенту на срок, указанный в Счете-договоре.</p>
              <p>3.2. Клиент вправе предоставлять своим уполномоченным лицам (далее – Пользователи) доступ для работы в Сервисе (передача уникальной учётной записи логина и пароля), при этом количество одновременно работающих в Сервисе Пользователей не должно превышать количество рабочих мест, указанных в оплаченном Клиентом Счете-договоре.</p>
              <p>3.2.1. В случае превышения количества Пользователей, работающих в Сервисе сверх количества рабочих мест, указанных в оплаченном Клиентом Счете-договоре, Клиент оплачивает Компании дополнительное вознаграждение согласно Тарифу за каждого нового Пользователя.</p>
              <p>3.3. Все действия, совершаемые Клиентом на Сервисе, считаются совершёнными им лично или его Пользователями.</p>
              <p>3.4. В случае утери доступа к Сервису по Реквизитам Клиент незамедлительно уведомляет об этом Компанию. После успешной проверки сведений о Клиенте Компания направляет ему новые Реквизиты доступа.</p>
              <p>3.5. По окончании доступа к Сервису Компания направляет Клиенту Счет-договор на новый срок доступа к Сервису.</p>
              <p>3.6. Если Клиент не оплачивает Счет-договор на новый срок, то Компания:</p>
              <p>3.6.1. блокирует доступ Клиента к Сервису;</p>
              <p>3.6.2. сохраняет данные Клиента в Сервисе в течение 3 (трёх) месяцев после блокировки.</p>

              <h3>4. Вознаграждение Компании</h3>
              <p>4.1. Размер вознаграждения Компании в месяц складывается из Тарифа, умноженного на количество предоставляемых прав доступа для пользования Сервисом, указанного в Счете-договоре и НДС не облагается на основании пп.26 п. 2 ст. 149 НК РФ.</p>
              <p>4.2. Вознаграждение Компании включает в себя права доступа пользования Сервисом на условиях, указанных в Счете-договоре.</p>
              <p>4.3. Стоимость Тарифа не включает возможные комиссии провайдеров платежей.</p>
              <p>4.4. Если Клиент оплачивает доступ к Сервису на срок, превышающий 8 месяцев, Компания вправе предоставить Клиенту скидку.</p>
              <p>4.5. Вознаграждение считается оплаченным с момента поступления денежных средств от Клиента согласно Счету-договору на расчётный счёт Компании.</p>
              <p>4.6. В случае задержки зачисления денежных средств на расчётный счёт Компании более, чем на 3 (три) дня, Клиент вправе обратиться к Компании, предоставив доказательства перечисления денежных средств.</p>
              <p>4.7. Клиент не вправе оплачивать Счет-договор с расчётного счёта третьих лиц, не получив предварительное письменное согласие Компании.</p>
              <p>4.8. Компания имеет право изменять Тариф в одностороннем порядке без предварительного согласования с Клиентом, при этом стоимость уже оплаченного Тарифа остаётся неизменной.</p>
              <p>4.9. Компания уведомляет об изменении Тарифа путём размещения информации на Сайте. Изменения вступают в силу на следующий календарный день после размещения информации на Сайте.</p>

              <h3>5. Приёмка</h3>
              <p>5.1. Если Клиент не представит возражений в течение 3 (трёх) календарных дней с момента направления Компанией Реквизитов доступа или открытия доступа к Сервису на новый срок, неисключительная лицензия на использование Сервиса считается предоставленной в полном объёме и надлежащим образом.</p>

              <h3>6. Гарантии Сторон</h3>
              <p>6.1. Исключительное право на Сервис, а также на доработки функционала, совершённые в процессе исполнения Соглашения, принадлежит Компании.</p>
              <p>6.2. Компания не гарантирует, что Сервис соответствует требованиям Клиента, будет предоставляться непрерывно, быстро, надёжно и без ошибок.</p>
              <p>6.3. Клиент заверяет Компанию, что:</p>
              <p>6.3.1. если от имени Компании регистрируется физическое лицо, либо ему предоставляется доступ к Сервису, то у такого физического лица есть полномочия на регистрацию и использование Сервиса;</p>
              <p>6.3.2. на все материалы, которые Клиент предоставляет Компании, у Клиента есть соответствующие права.</p>

              <h3>7. Запрещённые действия</h3>
              <p>Клиенту запрещается:</p>
              <p>7.1. Использовать Сервис способами, не предусмотренными Соглашением;</p>
              <p>7.2. Использовать программные ошибки Сервиса в своих целях и передавать информацию об их наличии третьим лицам, за исключением Компании;</p>
              <p>7.3. Предпринимать попытки обойти технические ограничения, установленные Сервисом; применять сторонние программы или иные средства для улучшения и/или автоматизации возможностей Сервиса;</p>
              <p>7.4. Выдавать себя за сотрудника Компании, бывшего или действующего;</p>
              <p>7.5. Фальсифицировать или удалять любую информацию о правообладателе Сервиса;</p>
              <p>7.6. Модифицировать программное обеспечение, входящее в Сервис, в том числе изменять, декомпилировать, дизассемблировать, дешифровать и производить иные действия с исходным кодом Сервиса;</p>
              <p>7.7. Распространять, копировать или иным образом обнародовать программное обеспечение, входящее в Сервис;</p>
              <p>7.8. Использовать Сервис или его части за пределами срока действия Соглашения и/или Счета-договора;</p>
              <p>7.9. Использовать Сервис для публикации, распространения, хранения, передачи в любой форме вредоносной, незаконной, угрожающей, клеветнической информации, подстрекающей к насилию над каким-либо лицом или группой лиц, содержащей оскорбления в адрес конкретных лиц или организаций.</p>

              <h3>8. Ответственность Сторон</h3>
              <p>8.1. Сервис и весь его функционал предоставляется «как есть». Клиент осознаёт и принимает риски, связанные с использованием Сервиса.</p>
              <p>8.2. Клиент несёт ответственность за:</p>
              <p>8.2.1. актуальность, достоверность, отсутствие претензий третьих лиц в отношении информации, предоставляемой при регистрации;</p>
              <p>8.2.2. любые материалы и информацию, которую размещает на Сервисе, а также последствия его использования;</p>
              <p>8.2.3. собственные действия на Сервисе в соответствии с законодательством РФ.</p>
              <p>8.3. Компания не несёт ответственности:</p>
              <p>8.3.1. за специализированные ресурсы и качество каналов сетей связи общего пользования, посредством которых предоставляется доступ к Сервису;</p>
              <p>8.3.2. за вред, причинённый Пользователями, которым Клиент предоставил доступ к Сервису;</p>
              <p>8.3.3. за возможные сбои и перерывы в работе Сервиса, прекращение его функционирования и вызванную ими потерю информации, в том числе за невозможность использования Сервиса на определённой территории;</p>
              <p>8.3.4. перед Клиентом, Пользователями или перед любыми третьими лицами за потерянные данные, размещённые на Сервисе;</p>
              <p>8.3.5. за поломки или другие неполадки компьютера, мобильного устройства, любого другого устройства Клиента, Пользователей и/или третьих лиц, возникшие во время использования ими Сервиса;</p>
              <p>8.3.6. за последствия, вызванные утерей или разглашением Клиентом и Пользователями своих данных, необходимых для доступа к Сервису;</p>
              <p>8.3.7. за ошибки и/или нарушения, связанные с эксплуатацией Сервиса и возникшие в результате неправомерных действий Клиента, Пользователей и/или третьих лиц;</p>
              <p>8.3.8. за действия третьих лиц по принудительному снижению доступности сети Интернет или программно-аппаратных компонентов Сервиса;</p>
              <p>8.3.9. за сбои и перерывы в работе Сервиса, вызванные обстоятельствами непреодолимой силы, а именно: авариями, пожарами, наводнениями, землетрясениями, забастовками, эпидемиями, войнами, действиями органов государственной власти, санкционными ограничениями или другими не зависящими от Сторон обстоятельствами. Такие обстоятельства должны быть подтверждены справками компетентных органов не позднее 10 (десяти) рабочих дней после начала их действия;</p>
              <p>8.3.10. за сбои и перерывы в работе Сервиса, вызванные действиями государственных органов, включая органы правопорядка, связанных с наложением ареста и/или изъятием, или иным препятствованием к доступу серверам подрядчиков Компании, на которых размещён Сервис.</p>
              <p>8.4. В случае если Клиент/Пользователь без письменного согласия/поручения Компании скопировал, внёс изменения, подготовил производные материалы, декомпилировал, дизассемблировал Сервис или совершил любые другие попытки получения доступа к исходному коду, каким-либо иным способом изменил Сервис, Компания вправе потребовать от Клиента/Пользователя выплатить штраф в размере 1 000 000 (один миллион) рублей за каждый выявленный факт такого нарушения.</p>

              <h3>9. Блокировка и удаление доступа к Сервису</h3>
              <p>9.1. Компания вправе незамедлительно заблокировать доступ Клиента/Пользователя к Сервису, если:</p>
              <p>9.1.1. Выявит нарушения Клиентом/Пользователями условий Соглашения и/или положений действующего законодательства Российской Федерации;</p>
              <p>9.1.2. Получит от третьих лиц претензии о нарушении Клиентом/Пользователями их прав;</p>
              <p>9.1.3. Получит соответствующие требования от государственных органов;</p>
              <p>9.1.4. Закончится оплаченный период доступа к Сервису и при этом отсутствует оплата на новый период.</p>
              <p>9.2. В случае блокировки доступа в Сервис Компанией оплаченные денежные средства за текущий период не возвращаются.</p>
              <p>9.3. Клиент/Пользователь обязуется самостоятельно предпринять все действия для прекращения выявленного Компанией нарушения.</p>

              <h3>10. Обработка персональных данных Клиента/Пользователя</h3>
              <p>10.1. Клиент/Пользователь при заполнении форм на Сайте для регистрации на Сервисе даёт Компании своё согласие на обработку персональных данных, при этом Клиент самостоятельно получает письменное согласие на обработку персональных данных всех допущенных к работе Сервиса Пользователей.</p>
              <p>10.2. Компания выполняет обработку персональных данных Клиента/Пользователей в целях исполнения Соглашения и согласно требованиям, установленным Федеральным законом «О персональных данных» от 27.07.2006 № 152-ФЗ (далее – Закон о персональных данных).</p>
              <p>10.3. Порядок обработки и защиты персональных данных определяется Политикой Компании, размещённой на сайте{' '}
                <a href="https://xn--80adjbxkgkgn3age6ate4b4a7b9a.xn--p1ai/" target="_blank" rel="noopener noreferrer">https://программадлястроителей.рф/</a>.
              </p>
              <p>10.4. В случае обработки Клиентом персональных данных третьих лиц, Клиент самостоятельно несёт ответственность за соблюдение надлежащих мер по защите их персональных данных согласно требованиям Закона о персональных данных.</p>

              <h3>11. Защита конфиденциальной информации</h3>
              <p>11.1. Стороны признают переданные Клиентом исходные данные коммерческой тайной (далее — Конфиденциальная информация).</p>
              <p>11.2. Компания обязуется не разглашать Конфиденциальную информацию третьим лицам без предварительного письменного согласия Клиента, за исключением случаев, когда такое раскрытие согласовано сторонами или необходимо для целей исполнения Соглашения.</p>
              <p>11.3. Компания может передавать любую информацию, полученную от Клиента, в отдельные, самостоятельно функционирующие, но входящие в состав Сервиса приложения и базы данных.</p>
              <p>11.4. Стороны вправе распространять Конфиденциальную информацию среди своих сотрудников.</p>
              <p>11.5. Компания обязана немедленно сообщать в письменной форме Клиенту обо всех попытках неуполномоченных лиц получить доступ к Конфиденциальной информации, которые станут известны Компании.</p>
              <p>11.6. Ответственность Сторон за разглашение Конфиденциальной информации ограничена возмещением документально подтверждённого реального ущерба.</p>

              <h3>12. Урегулирование споров</h3>
              <p>12.1. Все вопросы и разногласия, которые могут возникнуть между Сторонами, разрешаются в соответствии с законодательством Российской Федерации.</p>
              <p>12.2. Стороны обязуются соблюдать досудебный (претензионный) порядок урегулирования споров. Срок для ответа на претензию составляет 10 (десять) рабочих дней с момента её получения Стороной-получателем.</p>
              <p>12.3. В случае невозможности разрешения спора в претензионном порядке спор передаётся на рассмотрение в суд по месту нахождения Компании.</p>

              <h3>13. Срок действия Соглашения. Изменения и дополнения Соглашения</h3>
              <p>13.1. Соглашение считается заключённым с момента акцепта (оплаты Клиентом Счета-договора) и действует до полного выполнения сторонами принятых на себя обязательств.</p>
              <p>13.2. Соглашение может быть изменено или дополнено Компанией в любое время. Новая редакция Соглашения вступает в силу с момента её размещения на Сервисе.</p>
              <p>13.3. Клиент самостоятельно проверяет условия Соглашения на предмет их изменения и/или дополнения.</p>
              <p>13.4. Продолжение использования Сервиса после внесения изменений и/или дополнений в Соглашение означает принятие и согласие Клиентом с такими изменениями и/или дополнениями.</p>

              <h3>14. Дополнительные положения</h3>
              <p>14.1. Компания вправе направлять Клиенту сообщения/документы по электронной почте, предоставленной Клиентом при регистрации.</p>
              <p>14.2. При отсутствии доказательств фальсификации переписка по электронной почте и все полученные таким образом документы признаются юридически значимыми и являются надлежащим доказательством при судебном споре.</p>
              <p>14.3. Клиент вправе связаться с Компанией, направив письмо на электронный адрес <a href="mailto:4997829@mail.ru">4997829@mail.ru</a>.</p>
              <p>14.4. Признание по тем или иным причинам одного или нескольких положений Соглашения недействительными или не имеющими юридической силы не влияет на действительность или применимость остальных положений Соглашения.</p>
              <p>14.5. К отношениям, вытекающим из Соглашения, нормы о защите прав потребителей, предусмотренные законодательством Российской Федерации, не применяются в случае осуществления Клиентом предпринимательской деятельности.</p>
              <p>14.6. Сообщение/документы по электронной почте считаются полученными принимающей Стороной в день успешной отправки этого сообщения/документов, при условии, что оно отправляется по адресам, указанным Клиентом при регистрации. Отправка сообщения по электронной почте считается не состоявшейся, если передающая Сторона получает сообщение о невозможности доставки. В этом случае передающая Сторона должна отправить сообщение почтой, заказным письмом с уведомлением о вручении, по адресу места нахождения Клиента.</p>

              <h3 style={{ marginTop: 24 }}>Реквизиты Компании</h3>
              <p>
                Наименование: акционерное общество «СТРОЙИНТЕГРАЦИЯ»
                <br />Адрес: 121351, город Москва, ул. Партизанская, д. 35, к. 3, помещ. 2/1
                <br />ИНН/КПП: 9731148947 / 773101001
                <br />Расчётный счёт: 40702810420000198669
                <br />Банк: ООО «Банк Точка»
                <br />БИК: 044525104
                <br />Корреспондентский счёт: 30101810745374525104
                <br />Генеральный директор: Хуснуллин Ильдар Идеалович
                <br />Электронная почта: <a href="mailto:4997829@mail.ru">4997829@mail.ru</a>
              </p>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Landing;
